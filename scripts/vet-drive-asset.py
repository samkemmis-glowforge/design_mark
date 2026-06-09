#!/usr/bin/env python3
"""Downscale a Google-Drive image asset so it can be visually vetted cheaply.

Why this exists
---------------
`download_file_content` returns the file as a base64 string. For real creative
(print-grade PNG/JPG, 0.3-40 MB) that base64 blows past the model's token
budget, so the MCP harness instead *saves the raw JSON response to disk* and
hands back the path. That "error" path is exactly what we want: the heavy
bytes never enter the context window.

This script takes that saved JSON (or any base64-content JSON / raw image),
decodes it, and writes a small JPG thumbnail (long edge ~700px) that the model
can Read for a few hundred tokens instead of ~90k.

Usage
-----
    # explicit saved tool-result file
    python3 scripts/vet-drive-asset.py <saved-json-or-image> [out.jpg]

    # or auto-pick the newest download in the tool-results dir
    python3 scripts/vet-drive-asset.py --latest [out.jpg]

Prints the thumbnail path (and original dimensions) on success.
"""
import base64
import glob
import json
import os
import sys

TOOL_RESULTS_GLOB = os.path.expanduser(
    "~/.claude/projects/**/tool-results/*download_file_content*.txt"
)
OUT_DEFAULT = "/tmp/asset_vet/thumb.jpg"
LONG_EDGE = 700
JPEG_QUALITY = 72


def newest_tool_result():
    files = glob.glob(TOOL_RESULTS_GLOB, recursive=True)
    if not files:
        sys.exit(f"no download_file_content results found at {TOOL_RESULTS_GLOB}")
    return max(files, key=os.path.getmtime)


def load_image_bytes(path):
    """Return (raw_bytes, title). Handles MCP JSON wrapper or a raw image file."""
    with open(path, "rb") as fh:
        head = fh.read(1)
    if head in (b"{", b"["):  # JSON wrapper from download_file_content
        with open(path) as fh:
            doc = json.load(fh)
        return base64.b64decode(doc["content"]), doc.get("title", os.path.basename(path))
    with open(path, "rb") as fh:  # already a raw image
        return fh.read(), os.path.basename(path)


def montage(sources, out, cols=3, cell=300, pad=10):
    """Tile several assets into one labeled contact sheet for a single Read."""
    from PIL import Image, ImageDraw

    label_h = 18
    thumbs = []
    for src in sources:
        raw, title = load_image_bytes(src)
        try:
            import io
            im = Image.open(io.BytesIO(raw))
            im.thumbnail((cell, cell))
            if im.mode not in ("RGB", "L"):
                bg = Image.new("RGB", im.size, (255, 255, 255))
                bg.paste(im, mask=im.split()[-1] if im.mode in ("RGBA", "LA") else None)
                im = bg
            thumbs.append((im.convert("RGB"), title))
        except Exception as exc:  # skip unrenderable (e.g. svg/gif frames)
            print(f"skip {title}: {exc}")
    if not thumbs:
        sys.exit("nothing to montage")
    rows = (len(thumbs) + cols - 1) // cols
    cw, ch = cell + pad, cell + pad + label_h
    sheet = Image.new("RGB", (cols * cw + pad, rows * ch + pad), (245, 245, 245))
    draw = ImageDraw.Draw(sheet)
    for i, (im, title) in enumerate(thumbs):
        r, c = divmod(i, cols)
        x, y = pad + c * cw, pad + r * ch
        draw.text((x, y), title[:46], fill=(20, 20, 20))
        sheet.paste(im, (x, y + label_h))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.save(out, "JPEG", quality=70)
    print(f"montage={out} ({os.path.getsize(out)//1024} KB, {len(thumbs)} tiles)")


def main(argv):
    if not argv:
        sys.exit(__doc__)
    if argv[0] == "--montage":
        out = argv[1]
        montage(argv[2:], out)
        return
    if argv[0] == "--latest":
        src = newest_tool_result()
        out = argv[1] if len(argv) > 1 else OUT_DEFAULT
    else:
        src = argv[0]
        out = argv[1] if len(argv) > 1 else OUT_DEFAULT

    from PIL import Image
    import io

    raw, title = load_image_bytes(src)
    im = Image.open(io.BytesIO(raw))
    orig = im.size
    im.thumbnail((LONG_EDGE, LONG_EDGE))
    if im.mode not in ("RGB", "L"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1] if im.mode in ("RGBA", "LA") else None)
        im = bg
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, "JPEG", quality=JPEG_QUALITY)
    print(f"title={title}")
    print(f"orig={orig[0]}x{orig[1]}")
    print(f"thumb={out} ({os.path.getsize(out)//1024} KB)")


if __name__ == "__main__":
    main(sys.argv[1:])
