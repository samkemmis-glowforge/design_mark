#!/usr/bin/env python3
"""Process Gemini-drawn marks (/tmp/milo/marks-raw/*.png, black ink on white)
into transparent, trimmed, recolorable assets:
  assets/marks-gemini/<name>.png        ink   #1C1813
  assets/marks-gemini/<name>-teal.png   teal  #16A0B0
  assets/marks-gemini/<name>-cream.png  cream #F9E7CB
Alpha = ink darkness; trimmed to content + 4% margin."""
import glob
import os

import numpy as np
from PIL import Image

OUT = "assets/marks-gemini"
os.makedirs(OUT, exist_ok=True)
COLORS = {"": (0x1C, 0x18, 0x13), "-teal": (0x16, 0xA0, 0xB0), "-cream": (0xF9, 0xE7, 0xCB)}

for src in sorted(glob.glob("/tmp/milo/marks-raw/*.png")):
    name = os.path.splitext(os.path.basename(src))[0]
    g = np.array(Image.open(src).convert("L")).astype(np.int16)
    # normalize background (gen "white" can drift to ~245)
    bg = np.percentile(g, 90)
    alpha = np.clip((bg - g) * 255 / max(bg - g.min(), 1), 0, 255).astype(np.uint8)
    alpha[alpha < 18] = 0
    ys, xs = np.nonzero(alpha)
    if not len(ys):
        print(f"✗ {name}: empty"); continue
    mx = round(0.04 * max(xs.max() - xs.min(), ys.max() - ys.min())) + 4
    x0, x1 = max(xs.min() - mx, 0), min(xs.max() + mx, alpha.shape[1])
    y0, y1 = max(ys.min() - mx, 0), min(ys.max() + mx, alpha.shape[0])
    a = alpha[y0:y1, x0:x1]
    for suffix, c in COLORS.items():
        img = np.zeros((*a.shape, 4), dtype=np.uint8)
        img[..., 0], img[..., 1], img[..., 2] = c
        img[..., 3] = a
        Image.fromarray(img).save(f"{OUT}/{name}{suffix}.png")
    print(f"✓ {name} ({x1-x0}x{y1-y0})")
