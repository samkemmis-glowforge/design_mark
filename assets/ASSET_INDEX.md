# Asset index — searchable catalog of marketing images

`assets/index.json` maps each asset → AI-generated metadata (caption, tags,
colors, objects, suggested_use) so Design Mark (and any agent) can find
the right image by description instead of digging through Drive.

## First-level triage gate (keeps the index small)
A marketing Drive can hold tens of thousands of images, but most are **one-offs**:
ads locked to a specific promotion (baked-in price/sale date/coupon), internal or
one-off screenshots, and low-value scratch files. Before anything is indexed, the
vision model judges **`marketing_usable`** — is this a *generic, reuse-anywhere*
asset a designer could drop into a NEW campaign as-is? Only usable assets get a
full record in `index.json` and an embedding; everything else is recorded as a tiny
stub in **`assets/seen.json`** (id → `{u, r, n}`) so incremental runs skip it and
you keep an audit of what was rejected and why. Result: the searchable index stays
in the low thousands even when the source folder is ~28k images.

`reusability` buckets: `reusable` (kept) · `dated-promo` · `screenshot` ·
`low-value` (rejected).

## Search
```
npm run search -- holiday coasters gift     # ranked matches w/ Drive links
```

## Build / refresh the index
- **From a Google Drive folder (recursive):**
  1. GCP → Service Account → JSON key; share the Drive folder with its email.
  2. `export GOOGLE_APPLICATION_CREDENTIALS=/path/key.json DRIVE_FOLDER_ID=<id> GEMINI_API_KEY=…`
  3. `npm run index:drive`   (incremental; `-- --force` re-tags all)
- **From local files:** `npm run index:local -- assets/premium assets/marks-gemini`

## Semantic search (embeddings)
Each entry also gets a 768-d Gemini embedding in `assets/embeddings.json`, so
search matches *meaning*, not just keywords ("hot drinks" finds coffee/tea).
Build/refresh: `npm run index:embed` (after indexing). `search_assets` and the
CLI use it automatically; without a GEMINI key they fall back to keyword.

Tagging uses Gemini vision (`agent/tools/vision-tag.ts`); the Drive walker tags
each file's ~768px thumbnail (fast/cheap, no full download).

## For agents (MCP)
The MCP server exposes **`search_assets`** — other agents call it with a
natural-language query and get back ranked matches (caption, tags, URL). So
Design Mark can find and reuse a real asset from Drive while composing, instead
of being handed links.


## What's captured per asset
`caption`, **`subject_type`** (hardware · software-ui · finished-project · lifestyle ·
packaging · branding · promo-graphic), **`product`** (Aura/Spark/Pro/Glowforge app/
Premium…), **`features`** (Smartfit, Magic Canvas/AI, catalog, Print…), `tags`,
`colors`, `objects`, `has_text`, `suggested_use`, plus a semantic embedding. The
prompt knows Glowforge sells **both hardware and software**, so it distinguishes a
machine photo from an in-app screenshot from a finished project. Filter on it:
`search_assets({ query, subject_type: "software-ui" })` for in-app shots only.
