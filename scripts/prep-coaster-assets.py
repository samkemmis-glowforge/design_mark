#!/usr/bin/env python3
"""Derive the coaster hero's working assets from committed sources, so a
container rewind can't lose them (regenerates deterministically):

  milo-engrave2.png (committed) -> engrave2-burnt.png
                                                -> m2-cut-teal.png / -cream.png
"""
import numpy as np
from PIL import Image
from scipy import ndimage

A = "assets/magic-engraver"

# --- burnt engraving (dark ink, transparent elsewhere) for compositing ---
eng = Image.open(f"{A}/milo-engrave2.png").convert("L")
a = np.array(eng)
burnt = np.zeros((*a.shape, 4), dtype=np.uint8)
burnt[..., 0], burnt[..., 1], burnt[..., 2] = 0x2A, 0x14, 0x08
burnt[..., 3] = (255 - a).astype(np.uint8)
Image.fromarray(burnt).save(f"{A}/engrave2-burnt.png")

# --- solid-backed cut-outs (cream-on-ink, teal-on-cream) ---
ink = (255 - a) > 40
solid = ndimage.binary_dilation(
    ndimage.binary_opening(
        ndimage.binary_fill_holes(
            ndimage.binary_closing(ink, np.ones((25, 25)), border_value=0)),
        np.ones((9, 9))),
    np.ones((5, 5)))
alpha = (255 - a).astype(np.uint8)

def colorway(body, lines, out):
    img = np.zeros((*a.shape, 4), dtype=np.uint8)
    img[solid] = (*body, 255)
    ov = np.zeros_like(img)
    ov[..., 0], ov[..., 1], ov[..., 2] = lines
    ov[..., 3] = alpha
    Image.alpha_composite(Image.fromarray(img), Image.fromarray(ov)).save(out)

colorway((249, 231, 203), (28, 24, 19), f"{A}/m2-cut-cream.png")
colorway((14, 69, 77), (249, 231, 203), f"{A}/m2-cut-teal.png")
print("prepped coaster assets ->", A)
