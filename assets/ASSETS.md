# design_mark — shared asset library

Public repo, so these raw URLs work for **any agent in any repo** — no auth, no Canva, no Drive. Pinned to tag `assets-v1` for stable, immutable URLs.

## How another agent fetches an asset

```
curl -sL https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/assets-v1/assets/marks-gemini/arrow-swoosh-teal.png -o arrow.png
```

- **URL pattern:** `https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/assets-v1/<path>`  (path = the `path` field below)
- **Full machine-readable index:** `https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/assets-v1/assets/manifest.json`
  — point an agent at this one URL; it lists every file + URL.

## Kits

### marks_raster (30 files)
Hand-drawn doodle marks (Gemini-drawn raster, transparent PNG). Colorways: <name>.png=ink #1C1813, -teal #16A0B0, -cream #F9E7CB.

Example: https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/assets-v1/assets/marks-gemini/arrow-loop-cream.png

### marks_vector (10 files)
Same doodle marks as currentColor SVGs (recolor via CSS).

Example: https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/assets-v1/assets/marks/arrow-loop.svg

### hero_layers (24 files)
Magic Engraver hero composition layers (transparent PNG).

Example: https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/assets-v1/assets/hero-layers/cream-bg.png

### product_assets (12 files)
Source product assets: Milo photo, engravings, coaster scene, cutouts.

Example: https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/assets-v1/assets/magic-engraver/coaster-scene.png

## Updating

Edit assets, run `python3 scripts/gen-manifest.py`, commit, then move the tag:
```
git tag -f assets-v1 && git push -f origin assets-v1
```
(or bump REF in the script to `assets-v2` for a new immutable version).
