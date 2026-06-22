import { randomUUID } from "node:crypto";
import { basename, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { query } from "@anthropic-ai/claude-agent-sdk";

import { REPO_ROOT } from "../agent/brand.js";
import { renderSvg } from "../agent/tools/render-svg.js";
import { renderTemplate } from "../agent/tools/render-template.js";
import { generateImage } from "../agent/tools/generate-image.js";
import { buildDesignServer, type DesignHostTransports } from "../agent/design-server.js";
import { buildQueryOptions } from "../agent/runtime.js";
import { searchAssets } from "../agent/tools/asset-search.js";

/**
 * Design Mark as a remote MCP server (Streamable HTTP) so other agents — in any
 * repo — can use him by adding one URL to their MCP config. Every image-producing
 * tool returns a URL (served from /files), never a binary, so passing results
 * between agents is just a link.
 *
 * Tools:
 *   Low-level (deterministic): render_svg, render_template, generate_image, list_assets
 *   High-level (art-directed):  design_brief — runs the Design Mark agent on a brief
 *
 * Env: PORT, PUBLIC_BASE_URL (how callers reach /files), DESIGN_MCP_TOKEN (bearer
 * auth; if unset, open — set it in any real deployment), ANTHROPIC_API_KEY
 * (required only for design_brief), GEMINI_API_KEY + IMAGE_PROVIDER (generate_image).
 */

const PORT = Number(process.env.PORT ?? 8787);
const BASE = (process.env.PUBLIC_BASE_URL ?? process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${PORT}`).replace(/\/$/, "");
const OUT_DIR = resolve(REPO_ROOT, "output");
const TOKEN = process.env.DESIGN_MCP_TOKEN;

const ASPECT = ["1:1", "16:9", "4:5", "3:2", "9:16"] as const;

function urlFor(outPath: string): string {
  return `${BASE}/files/${basename(outPath)}`;
}
function assetResult(o: { outPath: string; width: number; height: number }) {
  const url = urlFor(o.outPath);
  return {
    content: [{ type: "text" as const, text: `${url}  (${o.width}×${o.height})` }],
    structuredContent: { url, width: o.width, height: o.height },
  };
}
function errResult(e: unknown) {
  return { isError: true, content: [{ type: "text" as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] };
}

/** A fresh MCP server with Design Mark's tools registered. */
function makeServer(): McpServer {
  const server = new McpServer({ name: "design-mark", version: "1.0.0" });

  server.registerTool("render_svg", {
    title: "Render SVG/HTML to a PNG URL",
    description: "Render agent-authored SVG or HTML (brand fonts embedded) to a PNG. Returns a URL. Use for crisp text, exact layout, vector looks.",
    inputSchema: {
      markup: z.string().describe("SVG (<svg…>) or HTML markup. Brand fonts (Inter, Pacifico) are available via font-family."),
      width: z.number().optional(), height: z.number().optional(),
      transparent: z.boolean().optional().describe("Keep background transparent."),
    },
  }, async ({ markup, width, height, transparent }) => {
    try {
      const out = await renderSvg({ markup, width, height, omitBackground: transparent, outPath: `output/mcp-${randomUUID()}.png` });
      return assetResult(out);
    } catch (e) { return errResult(e); }
  });

  server.registerTool("render_template", {
    title: "Render a brand template to a PNG URL",
    description: "Fill a registered brand template with content and render to a PNG URL.",
    inputSchema: {
      template: z.string().describe("Template id, e.g. 'feature-section'."),
      content: z.record(z.string(), z.any()).describe("Template fields (headline, body, cta, theme, …)."),
      width: z.number().optional(), height: z.number().optional(),
    },
  }, async ({ template, content, width, height }) => {
    try {
      const out = await renderTemplate({ template, content, width, height, outPath: `output/mcp-${randomUUID()}.png` });
      return assetResult(out);
    } catch (e) { return errResult(e); }
  });

  server.registerTool("generate_image", {
    title: "Generate a photoreal/lifestyle image URL",
    description: "Generate a photoreal scene via the configured image model (Gemini). Returns a URL. Not for text/UI — use render_svg for those.",
    inputSchema: {
      prompt: z.string(),
      aspect_ratio: z.enum(ASPECT).optional(),
    },
  }, async ({ prompt, aspect_ratio }) => {
    try {
      const out = await generateImage({ prompt, aspectRatio: aspect_ratio ?? "1:1", outPath: `output/mcp-${randomUUID()}.png` });
      return assetResult(out);
    } catch (e) { return errResult(e); }
  });

  server.registerTool("list_assets", {
    title: "List the shared asset library",
    description: "Return the catalog of reusable brand assets (marks, product images, hero layers) with their public URLs.",
    inputSchema: {},
  }, async () => {
    try {
      const manifest = await readFile(resolve(REPO_ROOT, "assets/manifest.json"), "utf8");
      return { content: [{ type: "text" as const, text: manifest }], structuredContent: JSON.parse(manifest) };
    } catch (e) { return errResult(e); }
  });

  server.registerTool("search_assets", {
    title: "Search the marketing asset library (semantic)",
    description: "Find existing brand/marketing images by description. Semantic search over the catalog — returns ranked matches with caption, tags, and a URL (Drive link or raw asset URL). Use before generating new imagery to reuse what already exists.",
    inputSchema: {
      query: z.string().describe("Natural-language description, e.g. 'warm holiday gift scene with wooden coasters'."),
      limit: z.number().optional().describe("Max results (default 8)."),
    },
  }, async ({ query, limit }) => {
    try {
      const hits = await searchAssets(query, limit ?? 8);
      const text = hits.length
        ? hits.map((h) => `• ${h.name} (${h.category}, ${h.score}) — ${h.caption}\n  ${h.url ?? ""}`).join("\n")
        : `No matches for "${query}".`;
      return { content: [{ type: "text" as const, text }], structuredContent: { hits } };
    } catch (e) { return errResult(e); }
  });

  server.registerTool("design_brief", {
    title: "Delegate a design brief to Design Mark",
    description: "Give Design Mark a brief and he art-directs it on-brand and returns finished asset URL(s). Autonomous (no clarifying questions) — include all the detail you want in the brief.",
    inputSchema: {
      brief: z.string().describe("What to make, for whom, the message, any must-haves."),
      format: z.string().optional().describe("e.g. 'ig-square 1080x1080', 'fb-link 1200x630'."),
    },
  }, async ({ brief, format }) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      return errResult(new Error("design_brief needs ANTHROPIC_API_KEY in the server env."));
    }
    const assets: string[] = [];
    const transports: DesignHostTransports = {
      askHuman: async () => "Proceed with your best judgment using the brand defaults; do not wait for input.",
      onAsset: async ({ path, width, height }) => { assets.push(`${urlFor(path)} (${width}×${height})`); },
    };
    try {
      const opts = await buildQueryOptions(buildDesignServer(transports));
      const prompt = format ? `${brief}\n\nFormat: ${format}` : brief;
      let summary = "";
      for await (const m of query({ prompt, options: opts })) {
        if (m.type === "assistant") {
          for (const b of m.message.content) if (b.type === "text" && b.text.trim()) summary = b.text.trim();
        }
      }
      return {
        content: [{ type: "text" as const, text: `${summary}\n\nAssets:\n${assets.join("\n") || "(none produced)"}` }],
        structuredContent: { summary, assets },
      };
    } catch (e) { return errResult(e); }
  });

  return server;
}

const app = express();
app.use(express.json({ limit: "12mb" }));

// Bearer auth (skipped only if no token configured — set one for any deployment).
app.use("/mcp", (req: Request, res: Response, next) => {
  if (!TOKEN) return next();
  if (req.headers.authorization === `Bearer ${TOKEN}`) return next();
  res.status(401).json({ error: "unauthorized" });
});

// Served assets — image URLs returned by the tools resolve here.
app.use("/files", express.static(OUT_DIR, { maxAge: "1h" }));
app.get("/healthz", (_req, res) => res.json({ ok: true, base: BASE }));

// Streamable HTTP MCP with session management (stateful; works with MCP clients).
const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post("/mcp", async (req: Request, res: Response) => {
  const sid = req.headers["mcp-session-id"] as string | undefined;
  let transport = sid ? transports[sid] : undefined;

  if (!transport && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (id) => { transports[id] = transport!; },
    });
    transport.onclose = () => { if (transport!.sessionId) delete transports[transport!.sessionId]; };
    await makeServer().connect(transport);
  } else if (!transport) {
    res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: "No valid session; send an initialize request first." }, id: null });
    return;
  }
  await transport.handleRequest(req, res, req.body);
});

const sessionReq = async (req: Request, res: Response) => {
  const sid = req.headers["mcp-session-id"] as string | undefined;
  const t = sid ? transports[sid] : undefined;
  if (!t) { res.status(400).send("Invalid or missing session id"); return; }
  await t.handleRequest(req, res);
};
app.get("/mcp", sessionReq);
app.delete("/mcp", sessionReq);

app.listen(PORT, () => {
  console.log(`⚡ Design Mark MCP server on :${PORT}  (files: ${BASE}/files, auth: ${TOKEN ? "on" : "OFF"})`);
});
