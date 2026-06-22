# Asset index — searchable catalog of marketing images

`assets/index.json` maps each asset → AI-generated metadata (caption, category,
tags, colors, objects, suggested_use) so Design Mark (and any agent) can find
the right image by description instead of digging through Drive.

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

Tagging uses Gemini vision (`agent/tools/vision-tag.ts`). The Drive walker tags
each file's ~768px thumbnail (fast/cheap, no full download). Next step: add
vector embeddings to `index.json` for true semantic search, and expose a
`search_assets` tool on the MCP server so other agents query it remotely.
