import { z } from "zod";
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { renderTemplate } from "./tools/render-template.js";
import { fetchReferences, type ReferenceKind } from "./tools/fetch-references.js";
import { generateImage, type AspectRatio } from "./tools/generate-image.js";
import { renderSvg } from "./tools/render-svg.js";
import { approveAsset } from "./tools/approve-asset.js";
import { fetchImage } from "./tools/fetch-image.js";
import { saveToDrive } from "./tools/save-to-drive.js";
import { searchAssets } from "./tools/asset-search.js";
import { renderCanvaTemplate, getCanvaTemplateFields, handoffToCanva } from "./tools/canva-template.js";
import { resolvePreset, presetCatalog } from "./presets.js";
import { listTemplates } from "../templates/index.js";

/**
 * Transports that differ between the CLI (Phase 2) and Slack (Phase 3) hosts.
 * The agent core stays identical; only how we ask the human and how we deliver
 * a finished asset changes.
 */
export interface DesignHostTransports {
  /** Ask the art director a clarifying question and resolve with their answer. */
  askHuman: (question: string, options?: string[]) => Promise<string>;
  /** Surface a finished asset (print path in CLI; upload to thread in Slack). */
  onAsset: (info: { path: string; width: number; height: number }) => Promise<void>;
}

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

export const DESIGN_SERVER_NAME = "design";

export const DESIGN_TOOL_NAMES = [
  "mcp__design__render_template",
  "mcp__design__render_svg",
  "mcp__design__generate_image",
  "mcp__design__fetch_references",
  "mcp__design__search_assets",
  "mcp__design__fetch_image",
  "mcp__design__save_to_drive",
  "mcp__design__approve_asset",
  "mcp__design__canva_template",
  "mcp__design__canva_template_fields",
  "mcp__design__handoff_to_canva",
  "mcp__design__ask_human",
];

export function buildDesignServer(transports: DesignHostTransports) {
  const renderTemplateTool = tool(
    "render_template",
    "Render a repeatable layout asset (feature section, etc.) from a brand template to PNG. " +
      "Refuses to render if a required field is missing — ask the human instead of guessing. " +
      "Available templates: " +
      listTemplates()
        .map((t) => `${t.name} (required: ${t.requiredFields.join(", ")})`)
        .join("; "),
    {
      template: z.string().describe("Template id, e.g. 'feature-section'"),
      eyebrow: z.string().optional().describe("Small kicker/label above the headline"),
      headline: z.string().optional().describe("Main headline (required by feature-section)"),
      body: z.string().optional().describe("Supporting body copy (required by feature-section)"),
      cta: z.string().optional().describe("Call-to-action button label"),
      theme: z
        .enum(["light", "cream", "teal", "ink"])
        .optional()
        .describe("Color theme; defaults to light"),
      imagePath: z
        .string()
        .optional()
        .describe("Path to a real image/screenshot for the image slot; omit for a branded placeholder"),
      preset: z.string().optional().describe(`Channel size preset (sets dimensions). One of: ${presetCatalog()}`),
      width: z.number().optional().describe("Override output width in px"),
      height: z.number().optional().describe("Override output height in px"),
      outPath: z.string().optional().describe("Output PNG path; auto-named under output/ if omitted"),
    },
    async (args) => {
      const content: Record<string, unknown> = {};
      for (const k of ["eyebrow", "headline", "body", "cta", "theme"] as const) {
        if (args[k] !== undefined) content[k] = args[k];
      }
      const preset = resolvePreset(args.preset);
      try {
        const result = await renderTemplate({
          template: args.template,
          content,
          imagePath: args.imagePath,
          outPath: args.outPath,
          width: args.width ?? preset?.width,
          height: args.height ?? preset?.height,
        });
        await transports.onAsset({ path: result.outPath, width: result.width, height: result.height });
        return text(
          `Rendered ${args.template} → ${result.outPath} (${result.width}×${result.height}, ${(
            result.bytes / 1024
          ).toFixed(0)} KB). Shown to the art director; invite critique.`,
        );
      } catch (err) {
        return text(`RENDER FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const renderSvgTool = tool(
    "render_svg",
    "Render agent-authored SVG or HTML to PNG. Use this for crisp-text branded graphics: " +
      "quote/stat cards, badges, simple diagrams, icon-style or vector looks — anything needing " +
      "EXACT text and layout. Author the SVG/HTML yourself using the brand palette hexes and " +
      "fonts from the spec; brand fonts are auto-embedded so text stays sharp and on-brand. " +
      "Do NOT use an image model for this.",
    {
      markup: z.string().describe("The SVG (<svg …>) or HTML markup to render"),
      preset: z.string().optional().describe(`Channel size preset (sets dimensions). One of: ${presetCatalog()}`),
      width: z.number().optional().describe("Output width in px (default 1080)"),
      height: z.number().optional().describe("Output height in px (default 1080)"),
      outPath: z.string().optional().describe("Output PNG path; auto-named under output/ if omitted"),
    },
    async (args) => {
      const preset = resolvePreset(args.preset);
      try {
        const result = await renderSvg({
          markup: args.markup,
          width: args.width ?? preset?.width,
          height: args.height ?? preset?.height,
          outPath: args.outPath,
        });
        await transports.onAsset({ path: result.outPath, width: result.width, height: result.height });
        return text(
          `Rendered graphic → ${result.outPath} (${result.width}×${result.height}, ${(
            result.bytes / 1024
          ).toFixed(0)} KB). Shown to the art director; invite critique.`,
        );
      } catch (err) {
        return text(`SVG RENDER FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const generateImageTool = tool(
    "generate_image",
    "Generate a PHOTOREAL or lifestyle scene via the configured image model. Use ONLY for " +
      "'product in context' / lifestyle shots — never for layout assets (use render_template) " +
      "or crisp-text/vector graphics. For our actual product UI, do not generate it: ask the " +
      "human for a real screenshot and composite it. Pull style references first.",
    {
      prompt: z.string().describe("Scene description for the image model"),
      aspectRatio: z
        .enum(["1:1", "16:9", "4:5", "3:2", "9:16"])
        .optional()
        .describe("Aspect ratio; defaults to 1:1"),
      references: z
        .array(z.string())
        .optional()
        .describe("Paths to style-reference images (from fetch_references) to condition the look"),
      outPath: z.string().optional().describe("Output PNG path; auto-named under output/ if omitted"),
    },
    async (args) => {
      try {
        const result = await generateImage({
          prompt: args.prompt,
          aspectRatio: args.aspectRatio as AspectRatio | undefined,
          references: args.references,
          outPath: args.outPath,
        });
        await transports.onAsset({ path: result.outPath, width: result.width, height: result.height });
        return text(
          `Generated scene via "${result.provider}" → ${result.outPath} (${result.width}×${result.height}). ` +
            `Shown to the art director; invite critique.`,
        );
      } catch (err) {
        return text(`IMAGE GEN FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const fetchReferencesTool = tool(
    "fetch_references",
    "List relevant brand references (swipe file) and exemplars (approved past work) to condition production.",
    {
      kind: z
        .enum(["references", "exemplars", "all"])
        .optional()
        .describe("Which library to pull; defaults to all"),
    },
    async (args) => {
      const result = await fetchReferences((args.kind ?? "all") as ReferenceKind);
      return text(JSON.stringify(result, null, 2));
    },
  );

  const searchAssetsTool = tool(
    "search_assets",
    "Search the indexed marketing-asset library — real Glowforge photos, in-app/UI shots, finished projects, and " +
      "lifestyle scenes catalogued from the marketing Drive — by natural-language description. Returns ranked matches " +
      "with captions and Drive URLs. Use it to find a real asset to composite, then pull the chosen one in with " +
      "fetch_image. Distinct from fetch_references (which is only our local brand swipe file).",
    {
      query: z.string().describe("Natural-language description of the asset you want (e.g. 'maker holding a finished sign')."),
      limit: z.number().optional().describe("Max results (default 8)."),
      subject_type: z
        .enum(["hardware", "software-ui", "finished-project", "lifestyle", "packaging", "branding", "promo-graphic", "other"])
        .optional()
        .describe("Restrict to one subject type, e.g. 'software-ui' for in-app shots."),
    },
    async (args) => {
      try {
        const hits = await searchAssets(args.query, args.limit ?? 8, args.subject_type);
        if (!hits.length) return text(`No indexed assets matched "${args.query}".`);
        return text(
          hits
            .map((h) => `[${h.score}] ${h.name} (${h.subject_type}${h.product ? "/" + h.product : ""})\n  ${h.caption}\n  ${h.url ?? "(no url)"}`)
            .join("\n\n"),
        );
      } catch (err) {
        return text(`SEARCH FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const fetchImageTool = tool(
    "fetch_image",
    "Download an image the human gave you as a Google Drive link/ID (or any direct http(s) image URL) onto local " +
      "disk, so render_template/render_svg/generate_image can use it. Returns the local path. Drive files shared " +
      "'Anyone with the link' work with no setup; restricted files need a service account configured. Use this " +
      "whenever a brief includes a Drive link or image URL — don't tell the human you can't reach Drive.",
    {
      source: z.string().describe("A Google Drive share link or file id, or a direct https image URL."),
      name: z.string().optional().describe("Optional short name hint for the saved file."),
    },
    async (args) => {
      try {
        const r = await fetchImage(args.source, args.name ?? "incoming");
        return text(`Downloaded → ${r.path} (${r.mime}, ${(r.bytes / 1024).toFixed(0)}KB). Use this path as the image input to a render/generate tool.`);
      } catch (err) {
        return text(`FETCH FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const saveToDriveTool = tool(
    "save_to_drive",
    "Upload a finished local asset to Google Drive and return its shareable link. Requires a service account " +
      "(GOOGLE_APPLICATION_CREDENTIALS) and the target folder shared with it as Editor; folder defaults to " +
      "DRIVE_UPLOAD_FOLDER_ID. Use when the human asks to save/export a final to Drive.",
    {
      path: z.string().describe("Local path of the asset to upload (e.g. an approved PNG)."),
      folderId: z.string().optional().describe("Drive folder id to upload into; defaults to DRIVE_UPLOAD_FOLDER_ID."),
      name: z.string().optional().describe("Optional filename to use in Drive."),
    },
    async (args) => {
      try {
        const r = await saveToDrive(args.path, { folderId: args.folderId, name: args.name });
        return text(`Uploaded to Drive: ${r.name} → ${r.link}`);
      } catch (err) {
        return text(`DRIVE UPLOAD FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const approveAssetTool = tool(
    "approve_asset",
    "Mark an asset approved: moves it from output/ (scratch) into approved/ (finals). " +
      "Call this when the art director approves a candidate ('ship it', 'approved', 'that's the one').",
    {
      path: z.string().describe("Path to the approved asset (the outPath returned by a render/generate tool)"),
    },
    async (args) => {
      try {
        const { from, to } = await approveAsset(args.path);
        return text(`Approved: ${from} → ${to}. Final asset is in approved/.`);
      } catch (err) {
        return text(`APPROVE FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const canvaTemplateFieldsTool = tool(
    "canva_template_fields",
    "Inspect which named fields a Canva Brand Template expects, so you can fill them correctly. " +
      "Requires a connected Canva integration.",
    {
      brandTemplateId: z.string().describe("The Canva brand template id"),
    },
    async (args) => {
      try {
        const fields = await getCanvaTemplateFields(args.brandTemplateId);
        return text(JSON.stringify(fields, null, 2));
      } catch (err) {
        return text(`CANVA FIELDS FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const canvaTemplateTool = tool(
    "canva_template",
    "Autofill one of the user's Canva Brand Templates with text and export it to PNG. Use this " +
      "when the human references a Canva brand template (by id). Check fields first with " +
      "canva_template_fields. Requires a connected Canva integration (Teams/Enterprise plan).",
    {
      brandTemplateId: z.string().describe("The Canva brand template id"),
      fields: z
        .record(z.string(), z.string())
        .describe("Map of template field name -> text value (from canva_template_fields)"),
      title: z.string().optional().describe("Optional title for the created design"),
      outPath: z.string().optional().describe("Output PNG path; auto-named under output/ if omitted"),
    },
    async (args) => {
      try {
        const result = await renderCanvaTemplate({
          brandTemplateId: args.brandTemplateId,
          fields: args.fields,
          title: args.title,
          outPath: args.outPath,
        });
        await transports.onAsset({ path: result.outPath, width: result.width, height: result.height });
        return text(
          `Autofilled Canva template → ${result.outPath} (${result.width}×${result.height}, design ${result.designId}). ` +
            `Shown to the art director; invite critique.`,
        );
      } catch (err) {
        return text(`CANVA TEMPLATE FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const handoffToCanvaTool = tool(
    "handoff_to_canva",
    "Push a finished local asset into the user's Canva uploads so they can hand-tweak it. " +
      "Requires a connected Canva integration.",
    {
      path: z.string().describe("Path to the local asset to upload (e.g. an approved PNG)"),
    },
    async (args) => {
      try {
        const { assetId, name } = await handoffToCanva(args.path);
        return text(`Uploaded "${name}" to the user's Canva (asset ${assetId}). It's in their Canva Uploads to edit.`);
      } catch (err) {
        return text(`CANVA HANDOFF FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  const askHumanTool = tool(
    "ask_human",
    "Ask the art director a clarifying question and wait for their answer. Use this before producing when the brief is missing required details.",
    {
      question: z.string().describe("The clarifying question to ask"),
      options: z.array(z.string()).optional().describe("Optional suggested answers"),
    },
    async (args) => {
      const answer = await transports.askHuman(args.question, args.options);
      return text(answer);
    },
  );

  return createSdkMcpServer({
    name: DESIGN_SERVER_NAME,
    version: "0.1.0",
    tools: [
      renderTemplateTool,
      renderSvgTool,
      generateImageTool,
      fetchReferencesTool,
      searchAssetsTool,
      fetchImageTool,
      saveToDriveTool,
      approveAssetTool,
      canvaTemplateFieldsTool,
      canvaTemplateTool,
      handoffToCanvaTool,
      askHumanTool,
    ],
  });
}
