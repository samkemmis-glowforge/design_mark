#!/usr/bin/env python3
"""Cut-out layers from milo-engrave2.png (black ink on white): solid-backed
silhouettes so type behind the dog is occluded. Two colorways:
  m2-cut-cream.png — cream body + ink lines   (light fields)
  m2-cut-teal.png  — deep-teal body + cream lines (dark fields)"""
import numpy as np
from PIL import Image
from scipy import ndimage

src = Image.open("assets/magic-engraver/milo-engrave2.png").convert("L")
a = np.array(src)
ink = (255 - a) > 40

closed = ndimage.binary_closing(ink, structure=np.ones((25, 25)), border_value=0)
solid = ndimage.binary_fill_holes(closed)
solid = ndimage.binary_opening(solid, structure=np.ones((9, 9)))
solid = ndimage.binary_dilation(solid, structure=np.ones((5, 5)))

alpha = (255 - a).astype(np.uint8)  # line intensity

def colorway(body, lines, out):
    img = np.zeros((*a.shape, 4), dtype=np.uint8)
    img[solid] = (*body, 255)
    overlay = np.zeros_like(img)
    overlay[..., 0], overlay[..., 1], overlay[..., 2] = lines
    overlay[..., 3] = alpha
    Image.alpha_composite(Image.fromarray(img), Image.fromarray(overlay)).save(out)

colorway((249, 231, 203), (28, 24, 19), "/tmp/milo/m2-cut-cream.png")   # cream + ink
colorway((14, 69, 77), (249, 231, 203), "/tmp/milo/m2-cut-teal.png")    # teal shade + cream
print("cutouts saved")
