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


def main(render_path, checks_path):
    spec = json.load(open(checks_path))
    img = cv2.imread(render_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    scale = img.shape[1] / spec["canvas"][0]  # render may be 2x

    failures = 0
    for c in spec["checks"]:
        x, y, w, h = [int(v * scale) for v in c["region"]]
        sub = gray[y:y + h, x:x + w]
        rmin, rmax = int(c["radius"][0] * scale), int(c["radius"][1] * scale)
        tol = c.get("tol", 6)

        found = detect_circle(sub, rmin, rmax)
        if not found:
            print(f"✗ {c['name']}: no circle detected in region"); failures += 1
            continue
        dcx, dcy, dr = found
        # back to canvas units
        circle = ((x + dcx) / scale, (y + dcy) / scale, dr / scale)

        report = {"name": c["name"], "detected_circle": [round(v, 1) for v in circle]}
        if "expect_center" in c:
            ex, ey = c["expect_center"]
            dx, dy = circle[0] - ex, circle[1] - ey
            report["circle_vs_expected"] = [round(dx, 1), round(dy, 1)]
            if abs(dx) > tol or abs(dy) > tol:
                failures += 1
        motif = ink_motif(sub, dcx, dcy, dr)
        if motif:
            cen, bbox = motif
            dx = (x + bbox[0]) / scale - circle[0]
            dy = (y + bbox[1]) / scale - circle[1]
            report["motif_bbox_vs_circle"] = [round(dx, 1), round(dy, 1)]
            report["motif_centroid_vs_circle"] = [
                round((x + cen[0]) / scale - circle[0], 1),
                round((y + cen[1]) / scale - circle[1], 1)]
            if abs(dx) > tol * 1.5 or abs(dy) > tol * 1.5:
                failures += 1
        print(json.dumps(report))

    print(f"{'✗ FAIL' if failures else '✓ PASS'} ({failures} violations)")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
