import { z } from "zod";
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { renderTemplate } from "./tools/render-template.js";
import { fetchReferences, type ReferenceKind } from "./tools/fetch-references.js";
import { generateImage, type AspectRatio } from "./tools/generate-image.js";
import { renderSvg } from "./tools/render-svg.js";
import { approveAsset } from "./tools/approve-asset.js";
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
  "mcp__design__approve_asset",
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
      approveAssetTool,
      askHumanTool,
    ],
  });
}
