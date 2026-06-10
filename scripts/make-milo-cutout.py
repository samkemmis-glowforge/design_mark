#!/usr/bin/env python3
"""Build the Milo cut-out layer for the hero: solid cream silhouette behind the
woodcut line work, transparent everywhere else, so giant type behind him is
cleanly blocked (VOLDOG-style cut-out) instead of showing through hatch gaps."""
import numpy as np
from PIL import Image
from scipy import ndimage

CREAM = (249, 231, 203)  # brand cream #F9E7CB

src = Image.open("/tmp/milo/lines-hires.png").convert("RGBA")
a = np.array(src)
ink = a[..., 3] > 32  # any drawn pixel

# Seal gaps between hatch lines, then fill enclosed holes -> solid body mask.
closed = ndimage.binary_closing(ink, structure=np.ones((25, 25)), border_value=0)
solid = ndimage.binary_fill_holes(closed)
solid = ndimage.binary_opening(solid, structure=np.ones((9, 9)))  # drop specks
solid = ndimage.binary_dilation(solid, structure=np.ones((5, 5)))  # tuck lines inside

out = np.zeros_like(a)
out[solid] = (*CREAM, 255)
cutout = Image.alpha_composite(Image.fromarray(out), src)
cutout.save("assets/magic-engraver/milo-cutout.png")

# Also export the bare silhouette mask (useful for shadows).
sil = np.zeros_like(a)
sil[solid] = (24, 21, 18, 255)
Image.fromarray(sil).save("/tmp/milo/silhouette.png")
print("cutout:", cutout.size)
