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

- [ ] **Phase 0** — Brand spec (no code) — the dependency for everything
- [ ] **Phase 1** — Template renderer MVP (CLI)
- [ ] **Phase 2** — Agent core (Claude Agent SDK, local CLI)
- [ ] **Phase 3** — Slack integration (Bolt + Socket Mode)
- [ ] **Phase 4** — Image generation tool
- [ ] **Phase 5** — SVG/code path for branded graphics
- [ ] **Phase 6** — Iteration & polish
