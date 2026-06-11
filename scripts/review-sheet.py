#!/usr/bin/env python3
"""Build the design-review contact sheet for a render. One command makes the
review discipline mechanical:

  - archives the render to output/history/<name>-<n>.png
  - row 1: previous archived version | current  (pairwise, not isolated)
  - row 2: full-res region crops (regions from the render's .checks.json
           if present, else center crops)
  - row 3: reference bar from assets/design-references/ (the standard to
           judge against, side by side — not from memory)

Usage: review-sheet.py <render.png> [region x,y,w,h ...]
Prints the sheet path; review it at full size before showing a human.
"""
import glob
import json
import os
import shutil
import sys

from PIL import Image, ImageDraw

REFS_DIR = "assets/design-references"
HIST_DIR = "output/history"
SHEET_W = 2200


def label(img, text):
    img = img.convert("RGB")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 8 * len(text) + 16, 26), fill=(20, 20, 20))
    d.text((8, 6), text, fill=(255, 255, 255))
    return img


def main():
    render = sys.argv[1]
    name = os.path.splitext(os.path.basename(render))[0]
    os.makedirs(HIST_DIR, exist_ok=True)

    prior = sorted(glob.glob(f"{HIST_DIR}/{name}-*.png"))
    prev_path = prior[-1] if prior else None
    archive = f"{HIST_DIR}/{name}-{len(prior) + 1:03d}.png"
    shutil.copy(render, archive)

    cur = Image.open(render)
    scale = cur.width / 1920 if cur.width >= 1920 else 1.0

    rows = []

    # Row 1: pairwise
    pair = []
    if prev_path:
        pair.append(label(Image.open(prev_path), f"PREV ({os.path.basename(prev_path)})"))
    pair.append(label(cur.copy(), "CURRENT"))
    rows.append(pair)

    # Row 2: full-res regions (from checks.json when available)
    regions = []
    checks_path = os.path.splitext(render)[0] + ".checks.json"
    if len(sys.argv) > 2:
        regions = [tuple(map(int, a.split(","))) for a in sys.argv[2:]]
    elif os.path.exists(checks_path):
        spec = json.load(open(checks_path))
        regions = [tuple(c["region"]) for c in spec["checks"]]
    if regions:
        crops = []
        for (x, y, w, h) in regions:
            crops.append(label(
                cur.crop((int(x * scale), int(y * scale),
                          int((x + w) * scale), int((y + h) * scale))),
                f"1:1 {x},{y}"))
        rows.append(crops)

    # Row 3: the reference bar
    refs = sorted(glob.glob(f"{REFS_DIR}/*"))
    if refs:
        rows.append([label(Image.open(r), os.path.basename(r)) for r in refs[:4]])

    # Compose: scale each row to common width
    row_imgs = []
    for tiles in rows:
        h = max(t.height for t in tiles)
        tiles = [t.resize((int(t.width * h / t.height), h)) for t in tiles]
        w = sum(t.width for t in tiles) + 10 * (len(tiles) + 1)
        row = Image.new("RGB", (w, h + 20), (245, 245, 245))
        x = 10
        for t in tiles:
            row.paste(t, (x, 10)); x += t.width + 10
        s = SHEET_W / row.width
        row_imgs.append(row.resize((SHEET_W, int(row.height * s))))

    sheet = Image.new("RGB", (SHEET_W, sum(r.height for r in row_imgs)), (245, 245, 245))
    y = 0
    for r in row_imgs:
        sheet.paste(r, (0, y)); y += r.height
    out = f"/tmp/milo/review-{name}.jpg"
    os.makedirs("/tmp/milo", exist_ok=True)
    sheet.save(out, "JPEG", quality=82)
    print(f"sheet={out}")
    print(f"archived={archive}")
    if not refs:
        print("note: assets/design-references/ is empty — no bar to judge against")


if __name__ == "__main__":
    main()
