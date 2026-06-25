# design_mark — shared asset library

Public repo, so these raw URLs work for **any agent in any repo** — no auth, no Canva, no Drive. Pinned to tag `claude/gifted-davinci-YFc85` for stable, immutable URLs.

## How another agent fetches an asset

```
curl -sL https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/claude/gifted-davinci-YFc85/assets/marks-gemini/arrow-swoosh-teal.png -o arrow.png
```

- **URL pattern:** `https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/claude/gifted-davinci-YFc85/<path>`  (path = the `path` field below)
- **Full machine-readable index:** `https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/claude/gifted-davinci-YFc85/assets/manifest.json`
  — point an agent at this one URL; it lists every file + URL.

## Kits

### marks_raster (30 files)
Hand-drawn doodle marks (Gemini-drawn raster, transparent PNG). Colorways: <name>.png=ink #1C1813, -teal #16A0B0, -cream #F9E7CB.

Example: https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/claude/gifted-davinci-YFc85/assets/marks-gemini/arrow-loop-cream.png

### marks_vector (10 files)
Same doodle marks as currentColor SVGs (recolor via CSS).

Example: https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/claude/gifted-davinci-YFc85/assets/marks/arrow-loop.svg

### hero_layers (24 files)
Magic Engraver hero composition layers (transparent PNG).

Example: https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/claude/gifted-davinci-YFc85/assets/hero-layers/cream-bg.png

### product_assets (12 files)
Source product assets: Milo photo, engravings, coaster scene, cutouts.

Example: https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/claude/gifted-davinci-YFc85/assets/magic-engraver/coaster-scene.png

### social_ready (23 files)
Finished, ready-to-post social graphics (1:1 = 1080x1080, 4:5 = 1080x1350). Fetch by URL and post directly — no editing required.

Example: https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/claude/gifted-davinci-YFc85/assets/social/email-premium-lab-2x1.png

## Updating & pinning

URLs track the default branch, so editing an asset + committing updates the
URL's bytes automatically (latest-always). Re-run `python3 scripts/gen-manifest.py`
after adding/removing files to refresh the catalog.

For an **immutable** pin (same bytes forever), swap the ref for a commit SHA:
```
https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/<commit-sha>/<path>
```
