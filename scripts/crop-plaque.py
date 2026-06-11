#!/usr/bin/env python3
"""Crop the Gemini-generated walnut plaque out of its white field."""
import numpy as np
from PIL import Image

im = Image.open("/tmp/milo/plaque-raw.png").convert("RGB")
a = np.array(im)
dark = (a < 242).any(axis=2)
ys, xs = np.where(dark)
m = 2
box = (xs.min() + m, ys.min() + m, xs.max() - m, ys.max() - m)
im.crop(box).save("assets/magic-engraver/plaque-walnut.png")
print("plaque:", im.crop(box).size)
