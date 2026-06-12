#!/usr/bin/env python3
"""Deterministic post-render design checks. Render scripts emit a JSON spec of
assertions; this measures the ACTUAL pixels and reports deltas + suggested
fixes, so layout beliefs get verified against reality.

Check types:
  circle-motif: detect the dominant circle in `region` (Hough), then
    - circle_vs_expected: detected circle center minus layout's believed center
    - motif_vs_circle:    centroid of dark "ink" inside the circle minus
                          the detected circle center
Usage: design-check.py <render.png> <checks.json>   (exit 1 if any |delta| > tol)
"""
import json
import sys

import cv2
import numpy as np


def detect_circle(gray, rmin, rmax):
    blur = cv2.GaussianBlur(gray, (9, 9), 2)
    circles = cv2.HoughCircles(
        blur, cv2.HOUGH_GRADIENT, dp=1.5, minDist=rmax,
        param1=120, param2=60, minRadius=rmin, maxRadius=rmax)
    if circles is None:
        return None
    # strongest (first) circle
    x, y, r = circles[0][0]
    return float(x), float(y), float(r)


def ink_motif(gray, cx, cy, r):
    """Dark-ink region inside the circle: returns (centroid, bbox_center).
    Bbox center is the honest 'is the motif centered' signal — the raw
    centroid is biased toward ink-dense areas (e.g. a dog's head)."""
    h, w = gray.shape
    yy, xx = np.ogrid[:h, :w]
    mask = (xx - cx) ** 2 + (yy - cy) ** 2 <= (r * 0.80) ** 2
    med = np.median(gray[mask])
    ink = mask & (gray < med - 35)
    if ink.sum() < 50:
        return None
    ys, xs = np.nonzero(ink)
    bbox = ((xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2)
    return (float(xs.mean()), float(ys.mean())), bbox


def _lin(c):
    """sRGB channel (0..1) → linear, for WCAG luminance."""
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def luminance(bgr):
    """Relative luminance map for a BGR uint8 image region."""
    b, g, r = [_lin(bgr[..., i].astype(np.float32) / 255) for i in range(3)]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def check_contrast(bgr, c):
    """Legibility: WCAG contrast ratio between the text ink and its background
    in a region. Background = dominant luminance; text = the minority cluster
    furthest from it (works whether ink is darker OR lighter than the field)."""
    L = luminance(bgr)
    bg = float(np.median(L))
    diff = np.abs(L - bg)
    thr = diff.max() * 0.45
    mask = diff > thr
    if mask.sum() < 20:
        return None, {"contrast": None, "note": "no text-like pixels found"}
    fg = float(np.median(L[mask]))
    hi, lo = max(fg, bg), min(fg, bg)
    ratio = (hi + 0.05) / (lo + 0.05)
    min_ratio = c.get("min", 4.5)  # WCAG AA normal text; pass 3.0 for large
    ok = ratio >= min_ratio
    return ok, {"contrast": round(ratio, 2), "min": min_ratio,
                "fg_lum": round(fg, 3), "bg_lum": round(bg, 3)}


def check_circle(gray, sub, x, y, scale, c):
    rmin, rmax = int(c["radius"][0] * scale), int(c["radius"][1] * scale)
    tol = c.get("tol", 6)
    found = detect_circle(sub, rmin, rmax)
    if not found:
        return False, {"note": "no circle detected in region"}
    dcx, dcy, dr = found
    circle = ((x + dcx) / scale, (y + dcy) / scale, dr / scale)
    ok = True
    report = {"detected_circle": [round(v, 1) for v in circle]}
    if "expect_center" in c:
        ex, ey = c["expect_center"]
        dx, dy = circle[0] - ex, circle[1] - ey
        report["circle_vs_expected"] = [round(dx, 1), round(dy, 1)]
        ok = ok and abs(dx) <= tol and abs(dy) <= tol
    # Motif-centering is meaningful for clean line art on a plain field, not
    # for photos (asymmetric dark fur skews the ink bbox). Opt out per check.
    motif = ink_motif(sub, dcx, dcy, dr) if c.get("check_motif", True) else None
    if motif:
        cen, bbox = motif
        dx = (x + bbox[0]) / scale - circle[0]
        dy = (y + bbox[1]) / scale - circle[1]
        report["motif_bbox_vs_circle"] = [round(dx, 1), round(dy, 1)]
        ok = ok and abs(dx) <= tol * 1.5 and abs(dy) <= tol * 1.5
    return ok, report


def main(render_path, checks_path):
    spec = json.load(open(checks_path))
    img = cv2.imread(render_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    scale = img.shape[1] / spec["canvas"][0]  # render may be 2x

    failures = 0
    for c in spec["checks"]:
        x, y, w, h = [int(v * scale) for v in c["region"]]
        kind = c.get("type", "circle")
        if kind == "contrast":
            ok, report = check_contrast(img[y:y + h, x:x + w], c)
        else:
            ok, report = check_circle(gray, gray[y:y + h, x:x + w], x, y, scale, c)
        if ok is False:
            failures += 1
        mark = "✓" if ok else ("·" if ok is None else "✗")
        print(f"{mark} {json.dumps({'name': c['name'], **report})}")

    print(f"{'✗ FAIL' if failures else '✓ PASS'} ({failures} violations)")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
