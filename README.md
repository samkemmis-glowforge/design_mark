# Slack Design-Agent Coworker

A Slack-integrated design agent that approximates a marketing design team for a
solo, technical marketer with no designer. The human is the **art director**;
the agent owns **production, not taste**.

## What it does

1. Reads a **brand spec** so output is on-brand by default.
2. Takes a brief from Slack (e.g. _"a product shot of our new layer tool"_).
3. Asks clarifying questions before producing anything.
4. Generates candidate assets and posts them back in the thread.
5. Iterates based on critique until the asset is approved.

## Core architecture decision: route each asset to the right method

**Do not send everything to an image model.** Each asset type has a production route:

| Asset type | Route | Why |
| --- | --- | --- |
| **Repeatable layout assets** (feature sections, social cards, banners) | HTML/React template + brand tokens → PNG via headless Playwright | Deterministic, perfectly on-brand |
| **Crisp-text branded graphics** (precise text, UI elements, vector look) | Agent authors SVG/HTML directly → PNG | Image models smear text; code does not |
| **Photoreal scenes** (product-in-context, lifestyle) | Image model as a tool; composite real screenshots for our actual UI | Models can't invent our real UI |

Brand consistency across a set comes from templates and fixed style
references/seeds — not from re-prompting an image model and hoping.

## Tech stack

- **Language:** TypeScript / Node
- **Agent runtime:** Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`), used programmatically with custom tools
- **Slack:** Bolt for JavaScript, Socket Mode (no public URL needed)
- **Rendering:** Playwright (Chromium) for HTML/SVG → PNG
- **Image generation:** image-model API, wrapped behind one swappable tool interface

## Repo structure

```
/brand/
  brand.json            # design tokens (machine-readable)
  brand.md              # voice, visual style, do/don'ts (agent reads this)
  references/           # swipe file: competitor + inspiration screenshots
  exemplars/            # our own approved past assets
/agent/
  system-prompt.md      # creative-director persona + brief-intake rules
  index.ts              # agent runtime, registers tools, runs the loop
  tools/
    render-template.ts  # HTML/React template + tokens -> PNG
    render-svg.ts       # agent-authored SVG/HTML -> PNG
    generate-image.ts   # image model API wrapper
    fetch-references.ts # pull relevant reference/exemplar images for context
/templates/
  feature-section/      # first template
/slack/
  app.ts                # Bolt + Socket Mode; a thread = one iteration session
/output/                # generated assets (gitignored)
```

## Build phases

Built **one phase at a time**, top to bottom. Later phases depend on earlier artifacts.

- [x] **Phase 0** — Brand spec (`brand/brand.json`, `brand/brand.md`) — Glowforge color system locked in
- [x] **Phase 1** — Template renderer MVP (CLI) — feature-section → PNG via Playwright
- [x] **Phase 2** — Agent core (Claude Agent SDK, local CLI) — creative-director persona, routes briefs, asks before guessing
- [x] **Phase 3** — Slack integration (Bolt + Socket Mode) — thread = session, in-thread Q&A, PNG uploads
- [x] **Phase 4** — Image generation tool — pluggable `generate_image`; offline placeholder + Gemini adapter (set `GEMINI_API_KEY` + `IMAGE_PROVIDER=gemini`)
- [x] **Phase 5** — SVG/code path for branded graphics — agent authors SVG/HTML, crisp text via render_svg
- [x] **Phase 6** — Iteration & polish — critique loop, channel presets, versioned files, approve→finals

## Running (Phase 1)

```bash
npm install                 # deps (Chromium comes via @sparticuz/chromium; CDN is blocked here)
npm run render:sample       # renders sample feature sections to /output

# Ad-hoc render from the CLI:
npm run render -- --template feature-section \
  --eyebrow "New in Glowforge" --headline "Make Something Magical." \
  --body "Your idea, made real." --cta "Get started" --theme teal \
  --out output/demo.png
```

Themes: `light` (default), `cream`, `teal`, `ink`. Pass `--image path.png` to fill
the image slot; otherwise a branded placeholder is rendered.

## Running the agent (Phase 2)

```bash
export ANTHROPIC_API_KEY=sk-ant-...     # required for the agent to run
npm run agent -- "feature section announcing the layer tool"
```

The agent loads the brand spec, classifies the brief into a production route
(layout template / SVG-code / image), asks clarifying questions in the terminal
when the brief is thin (it won't guess required copy, channel, or dimensions),
pulls references, then renders. Set `AGENT_MODEL` to override the model.

The agent core is host-agnostic: `agent/design-server.ts` takes injectable
`askHuman` / `onAsset` transports, so Phase 3 swaps the terminal for a Slack thread
without touching the agent logic.

## Running in Slack (Phase 3)

A Slack **thread is a session**: DM the bot (or @-mention it in a channel) to start
one; replies in-thread continue it with full context. Clarifying questions arrive as
thread replies; you answer in-thread; rendered PNGs are uploaded to the thread.

**One-time Slack app setup:**
1. Go to <https://api.slack.com/apps> → **Create New App** → **From a manifest**, and
   paste `slack/manifest.yml`.
2. **Socket Mode**: enable it, then **Basic Information → App-Level Tokens** → generate
   a token with the `connections:write` scope → copy the `xapp-…` token.
3. **Install App** to your workspace → copy the **Bot User OAuth Token** (`xoxb-…`).
4. Export the env and run:
   ```bash
   export SLACK_BOT_TOKEN=xoxb-...
   export SLACK_APP_TOKEN=xapp-...
   export ANTHROPIC_API_KEY=sk-ant-...
   npm run slack
   ```
5. In Slack, DM the bot: _"feature section announcing the layer tool"_ — it'll ask its
   questions in-thread and post the candidate.

No public URL is needed (Socket Mode). The agent must run somewhere persistent (your
machine or a small host) for the bot to stay online.

## Image generation (Phase 4)

The photoreal route lives behind **one pluggable interface** (`agent/tools/generate-image.ts`),
selected by the `IMAGE_PROVIDER` env var:

- `placeholder` (default) — deterministic, offline, renders an on-brand stand-in so the
  pipeline works without any external API.
- `gemini` — real generation via the Gemini image models ("Nano Banana" family). It
  passes brand references as input parts to keep the look on-brand. To use it:
  ```bash
  export IMAGE_PROVIDER=gemini
  export GEMINI_API_KEY=...                       # or GOOGLE_API_KEY
  export GEMINI_IMAGE_MODEL=gemini-2.5-flash-image # optional; default shown
  ```

Add another backend (OpenAI, Flux, …) by implementing one `ImageProvider.generate()`
method and registering it in `PROVIDERS`.

> **Note on Canva:** Canva's Connect API does **not** expose Magic Media text-to-image
> as a programmatic endpoint. Its public APIs are Autofill, Brand Templates, asset
> upload, image *modification* (mask+prompt edit), and export. So Canva is a fit for
> brand-template autofill / asset handoff and image *editing*, but **not** for
> programmatic photoreal *generation* — that needs a dedicated image model behind this
> interface.

### Rendering notes
- Chromium is sourced from npm (`@sparticuz/chromium`) and driven by `playwright-core`,
  because this environment blocks Playwright's browser CDN. Set `PLAYWRIGHT_CHROMIUM_PATH`
  to use a system Chromium instead.
- Inter is embedded from `@fontsource/inter` as base64 `@font-face`, so rendering is
  deterministic and offline (no Google Fonts CDN dependency).
