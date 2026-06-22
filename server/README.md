# Design Mark — remote MCP server

Lets **other agents (in any repo)** use Design Mark by adding one URL to their MCP
config. Every image-producing tool returns a **URL** (served from `/files`), never a
binary — so passing results between agents is just a link.

## Tools

| Tool | Kind | Returns |
|------|------|---------|
| `render_svg` | low-level | URL — agent-authored SVG/HTML → PNG (brand fonts embedded) |
| `render_template` | low-level | URL — fill a registered brand template |
| `generate_image` | low-level | URL — photoreal scene via Gemini |
| `list_assets` | low-level | the shared asset-library catalog (marks, product, hero layers) |
| `design_brief` | high-level | URL(s) — give a brief, Design Mark art-directs it on-brand |

## Run

```bash
export PUBLIC_BASE_URL=https://designmark.yourhost.com   # how callers reach /files
export DESIGN_MCP_TOKEN=$(openssl rand -hex 24)          # bearer auth (set one!)
export ANTHROPIC_API_KEY=sk-ant-...                      # only needed for design_brief
export IMAGE_PROVIDER=gemini GEMINI_API_KEY=...           # for generate_image
npm run mcp            # listens on $PORT (default 8787): POST /mcp, GET /files/*
```

Needs a **public, always-on host** (MCP-over-HTTP is a real endpoint — unlike the
Slack Socket-Mode bot, there's no hiding it behind a tunnel). Any small host works
(Railway / Render / Fly / a VPS). `GET /healthz` for liveness.

## Consume (from another agent's repo)

Add to that repo's `.mcp.json`:

```json
{
  "mcpServers": {
    "design-mark": {
      "type": "http",
      "url": "https://designmark.yourhost.com/mcp",
      "headers": { "Authorization": "Bearer YOUR_DESIGN_MCP_TOKEN" }
    }
  }
}
```

The agent then has `design_brief`, `render_svg`, etc. in its toolbelt and gets back
image URLs it can drop straight into its own work.
