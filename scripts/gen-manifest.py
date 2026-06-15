#!/usr/bin/env python3
"""Generate a public asset manifest so any agent (in any repo) can fetch
individual files by URL. The repo is public, so raw.githubusercontent.com
URLs need no auth. Pinned to a tag (REF) for stable, immutable URLs.

Outputs assets/manifest.json (machine-readable) + assets/ASSETS.md (human).
Bump REF and re-tag when assets change (see ASSETS.md)."""
import glob
import json
import os
import time

REF = "claude/gifted-davinci-YFc85"  # default branch (public); pin to a commit SHA for immutability
OWNER, REPO = "samkemmis-glowforge", "design_mark"
BASE = f"https://raw.githubusercontent.com/{OWNER}/{REPO}/{REF}/"

GROUPS = {
    "marks_raster": ("assets/marks-gemini", ("*.png",),
                     "Hand-drawn doodle marks (Gemini-drawn raster, transparent PNG). "
                     "Colorways: <name>.png=ink #1C1813, -teal #16A0B0, -cream #F9E7CB."),
    "marks_vector": ("assets/marks", ("*.svg",),
                     "Same doodle marks as currentColor SVGs (recolor via CSS)."),
    "hero_layers": ("assets/hero-layers", ("*.png",),
                    "Magic Engraver hero composition layers (transparent PNG)."),
    "product_assets": ("assets/magic-engraver", ("*.png", "*.jpg", "*.svg"),
                       "Source product assets: Milo photo, engravings, coaster scene, cutouts."),
}

manifest = {
    "repo": f"{OWNER}/{REPO}", "ref": REF, "base_url": BASE,
    "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "url_pattern": BASE + "<path>",
    "groups": {},
}
for key, (d, pats, desc) in GROUPS.items():
    files = []
    for pat in pats:
        files += glob.glob(f"{d}/{pat}")
    entries = []
    for f in sorted(files):
        entries.append({
            "name": os.path.basename(f),
            "path": f,
            "url": BASE + f,
            "bytes": os.path.getsize(f),
        })
    manifest["groups"][key] = {"description": desc, "dir": d, "count": len(entries), "files": entries}

with open("assets/manifest.json", "w") as fh:
    json.dump(manifest, fh, indent=2)

# Human-readable index
lines = [
    "# design_mark — shared asset library",
    "",
    f"Public repo, so these raw URLs work for **any agent in any repo** — no auth, "
    f"no Canva, no Drive. Pinned to tag `{REF}` for stable, immutable URLs.",
    "",
    "## How another agent fetches an asset",
    "",
    "```",
    f"curl -sL {BASE}assets/marks-gemini/arrow-swoosh-teal.png -o arrow.png",
    "```",
    "",
    f"- **URL pattern:** `{BASE}<path>`  (path = the `path` field below)",
    f"- **Full machine-readable index:** `{BASE}assets/manifest.json`",
    "  — point an agent at this one URL; it lists every file + URL.",
    "",
    "## Kits",
    "",
]
for key, g in manifest["groups"].items():
    lines.append(f"### {key} ({g['count']} files)")
    lines.append(g["description"])
    lines.append("")
    ex = g["files"][0]["url"] if g["files"] else ""
    if ex:
        lines.append(f"Example: {ex}")
    lines.append("")
lines += [
    "## Updating & pinning",
    "",
    "URLs track the default branch, so editing an asset + committing updates the",
    "URL's bytes automatically (latest-always). Re-run `python3 scripts/gen-manifest.py`",
    "after adding/removing files to refresh the catalog.",
    "",
    "For an **immutable** pin (same bytes forever), swap the ref for a commit SHA:",
    "```",
    f"{BASE.replace(REF, '<commit-sha>')}<path>",
    "```",
    "",
]
with open("assets/ASSETS.md", "w") as fh:
    fh.write("\n".join(lines))

total = sum(g["count"] for g in manifest["groups"].values())
print(f"manifest: {total} files across {len(manifest['groups'])} kits")
