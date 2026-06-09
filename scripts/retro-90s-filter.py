#!/usr/bin/env python3
"""Give any (ideally transparent-PNG) product shot a fun '90s / SNES / VHS look.

The effect stack, all alpha-preserving so the result drops straight into a
composite:
  1. saturation + contrast punch
  2. posterize (flat, retro color banding)
  3. chromatic aberration (RGB channel split — the classic glitch fringe)
  4. CRT scanlines
  5. optional chunky pixelation (16-bit feel)
  6. sticker treatment: thick outline + neon outer glow + hard drop shadow

Usage:
    python3 scripts/retro-90s-filter.py IN.png OUT.png [--width 1600]
        [--posterize 4] [--chroma 6] [--scanline 3] [--pixelate 0]
        [--outline 14] [--glow coral|teal|yellow|purple] [--no-shadow]

Writes OUT.png (transparent, sticker-treated) plus OUT.panel.jpg, a before/after
preview on a '90s panel for quick review.
"""
import argparse
import sys

from PIL import Image, ImageEnhance, ImageFilter, ImageChops

try:
    import numpy as np
    HAVE_NP = True
except Exception:
    HAVE_NP = False

GLOW = {
    "coral": (255, 163, 153),
    "teal": (22, 160, 176),
    "yellow": (255, 230, 119),
    "purple": (130, 26, 171),
}

# Luminance ramps (shadow -> highlight) for the gradient-map "duotone". The
# white machine has little color to push, so remapping brightness into a neon
# ramp is what actually sells the '90s look. Stops use brand-family hues.
DUOTONE = {
    "vaporwave": [(0, (24, 8, 70)), (110, (130, 26, 171)), (190, (255, 99, 180)), (255, (138, 240, 240))],
    "sunset": [(0, (20, 6, 60)), (95, (130, 26, 171)), (175, (255, 99, 120)), (255, (255, 230, 119))],
    "teal": [(0, (8, 30, 60)), (130, (16, 110, 150)), (255, (201, 237, 242))],
    "none": None,
}


def gradient_map(rgb, stops):
    """Remap luminance to a color ramp (duotone/tritone), keeping detail."""
    if not stops:
        return rgb
    luts = ([], [], [])
    for v in range(256):
        # find bracketing stops
        lo = stops[0]
        hi = stops[-1]
        for i in range(len(stops) - 1):
            if stops[i][0] <= v <= stops[i + 1][0]:
                lo, hi = stops[i], stops[i + 1]
                break
        span = max(1, hi[0] - lo[0])
        t = (v - lo[0]) / span
        for c in range(3):
            luts[c].append(round(lo[1][c] + (hi[1][c] - lo[1][c]) * t))
    gray = rgb.convert("L")
    return Image.merge("RGB", tuple(gray.point(luts[c]) for c in range(3)))


def crop_to_content(im, pad=24):
    if im.mode != "RGBA":
        return im
    bbox = im.split()[-1].getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def chromatic(rgb, dx):
    """Shift R right and B left by dx px for an RGB glitch fringe."""
    if dx <= 0:
        return rgb
    r, g, b = rgb.split()
    if HAVE_NP:
        ra = np.roll(np.asarray(r), dx, axis=1)
        ba = np.roll(np.asarray(b), -dx, axis=1)
        r = Image.fromarray(ra)
        b = Image.fromarray(ba)
    else:
        r = ImageChops.offset(r, dx, 0)
        b = ImageChops.offset(b, -dx, 0)
    return Image.merge("RGB", (r, g, b))


def scanlines(rgb, period, darken=0.80):
    if period <= 1:
        return rgb
    w, h = rgb.size
    mask = Image.new("L", (1, period), 255)
    for y in range(period):
        mask.putpixel((0, y), 255 if y % period else int(255 * darken))
    mask = mask.resize((w, h))
    dark = ImageEnhance.Brightness(rgb).enhance(darken)
    return Image.composite(rgb, dark, mask)


def pixelate(im, block):
    if block <= 1:
        return im
    w, h = im.size
    small = im.resize((max(1, w // block), max(1, h // block)), Image.NEAREST)
    return small.resize((w, h), Image.NEAREST)


def retro(im, args):
    im = crop_to_content(im).convert("RGBA")
    if args.width and im.width > args.width:
        h = round(im.height * args.width / im.width)
        im = im.resize((args.width, h), Image.LANCZOS)
    alpha = im.split()[-1]
    rgb = im.convert("RGB")

    if args.duotone and DUOTONE.get(args.duotone):
        rgb = gradient_map(rgb, DUOTONE[args.duotone])
    rgb = ImageEnhance.Color(rgb).enhance(1.65)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.18)
    if args.posterize:
        from PIL import ImageOps
        rgb = ImageOps.posterize(rgb, args.posterize)
    rgb = chromatic(rgb, args.chroma)
    rgb = scanlines(rgb, args.scanline)
    treated = Image.merge("RGBA", (*rgb.split(), alpha))
    if args.pixelate:
        treated = pixelate(treated, args.pixelate)
    return treated


def stickerize(im, outline, glow_rgb, shadow):
    """Thick outline + neon outer glow + hard drop shadow, on a roomy canvas."""
    pad = outline * 4 + 40
    W, H = im.width + pad * 2, im.height + pad * 2
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ox, oy = pad, pad
    alpha = im.split()[-1]

    # silhouette, dilated for the white sticker border
    sil = Image.new("RGBA", im.size, (255, 255, 255, 255))
    sil.putalpha(alpha)
    border_a = alpha.filter(ImageFilter.MaxFilter(outline | 1))
    white = Image.new("RGBA", im.size, (255, 255, 255, 255))
    white.putalpha(border_a)

    # neon outer glow
    glow_a = alpha.filter(ImageFilter.MaxFilter((outline * 2) | 1))
    glow_a = glow_a.filter(ImageFilter.GaussianBlur(outline))
    glow = Image.new("RGBA", im.size, (*glow_rgb, 255))
    glow.putalpha(glow_a.point(lambda v: int(v * 0.9)))

    if shadow:
        sh_a = alpha.filter(ImageFilter.MaxFilter(3))
        shadow_img = Image.new("RGBA", im.size, (48, 9, 63, 255))
        shadow_img.putalpha(sh_a.point(lambda v: int(v * 0.55)))
        canvas.alpha_composite(shadow_img, (ox + outline + 10, oy + outline + 12))

    canvas.alpha_composite(glow, (ox, oy))
    canvas.alpha_composite(white, (ox, oy))
    canvas.alpha_composite(im, (ox, oy))
    return crop_to_content(canvas, pad=8)


def panel(before, after, out):
    """Before/after on a vaporwave panel for quick review."""
    cw, ch = 520, 460
    sheet = Image.new("RGB", (cw * 2, ch), (20, 10, 60))
    for i, img in enumerate((before, after)):
        cell = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        c = img.copy()
        c.thumbnail((cw - 60, ch - 60))
        cell.alpha_composite(c, ((cw - c.width) // 2, (ch - c.height) // 2))
        base = Image.new("RGB", (cw, ch), (32 + i * 60, 12, 80 - i * 20))
        base = Image.composite(cell.convert("RGB"), base, cell.split()[-1])
        sheet.paste(base, (i * cw, 0))
    sheet.save(out, quality=86)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=1600)
    ap.add_argument("--posterize", type=int, default=4)
    ap.add_argument("--chroma", type=int, default=6)
    ap.add_argument("--scanline", type=int, default=3)
    ap.add_argument("--pixelate", type=int, default=0)
    ap.add_argument("--outline", type=int, default=14)
    ap.add_argument("--glow", default="coral", choices=list(GLOW))
    ap.add_argument("--duotone", default="none", choices=list(DUOTONE))
    ap.add_argument("--no-shadow", action="store_true")
    args = ap.parse_args()

    src = Image.open(args.src)
    before = crop_to_content(src.convert("RGBA"))
    treated = retro(src, args)
    sticker = stickerize(treated, args.outline, GLOW[args.glow], not args.no_shadow)
    sticker.save(args.out)
    panel(before, sticker, args.out.rsplit(".", 1)[0] + ".panel.jpg")
    print(f"✓ {args.out}  ({sticker.width}x{sticker.height})")
    print(f"✓ {args.out.rsplit('.', 1)[0]}.panel.jpg  (before/after)")


if __name__ == "__main__":
    main()
