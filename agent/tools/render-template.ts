import { readFile } from "node:fs/promises";
import { extname, isAbsolute, resolve } from "node:path";
import { loadBrand, brandFontFamilies, REPO_ROOT } from "../brand.js";
import { fontFaceStyles } from "../render/fonts.js";
import { htmlToPng, type HtmlToPngResult } from "../render/html-to-png.js";
import { getTemplate, listTemplates } from "../../templates/index.js";

export interface RenderTemplateInput {
  /** Template id, e.g. "feature-section". */
  template: string;
  /** Content fields for the template (headline, body, cta, theme, ...). */
  content: Record<string, unknown>;
  /** Optional path to an image for the template's image slot. */
  imagePath?: string;
  /** Output PNG path (absolute or repo-relative). Defaults to /output/<template>-<ts>.png. */
  outPath?: string;
  /** Override default size. */
  width?: number;
  height?: number;
}

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

async function toDataUri(imagePath: string): Promise<string> {
  const abs = isAbsolute(imagePath) ? imagePath : resolve(REPO_ROOT, imagePath);
  const mime = MIME[extname(abs).toLowerCase()];
  if (!mime) throw new Error(`Unsupported image type for ${imagePath}`);
  const data = await readFile(abs);
  return `data:${mime};base64,${data.toString("base64")}`;
}

function slug(s: string): string {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "asset";
}

/**
 * Render a layout template to PNG with brand tokens injected.
 * Throws if a required content field is missing — the production engine must
 * never silently guess required copy.
 */
export async function renderTemplate(input: RenderTemplateInput): Promise<HtmlToPngResult> {
  const brand = await loadBrand();
  const tpl = getTemplate(input.template);

  const missing = tpl.requiredFields.filter(
    (f) => input.content[f] === undefined || input.content[f] === null || input.content[f] === "",
  );
  if (missing.length) {
    throw new Error(
      `Template "${tpl.name}" is missing required field(s): ${missing.join(", ")}. ` +
        `Ask the art director rather than guessing.`,
    );
  }

  const imageDataUri = input.imagePath ? await toDataUri(input.imagePath) : null;
  const fontFaceCSS = await fontFaceStyles(brandFontFamilies(brand));
  const html = tpl.render({ brand, content: input.content, imageDataUri, fontFaceCSS });

  const size = {
    width: input.width ?? tpl.defaultSize.width,
    height: input.height ?? tpl.defaultSize.height,
  };
  const outPath =
    input.outPath ?? `output/${tpl.name}-${slug(String(input.content.headline ?? ""))}-${Date.now()}.png`;

  return htmlToPng({ html, width: size.width, height: size.height, outPath });
}

/* ------------------------------ CLI ------------------------------ */
// Usage:
//   tsx agent/tools/render-template.ts --template feature-section \
//     --headline "..." --body "..." --cta "Get started" --theme teal \
//     --image path/to.png --out output/foo.png --width 1200 --height 675
// Or pass a content JSON blob: --content '{"headline":"...","body":"..."}'

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a?.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = "true";
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    for (const t of listTemplates()) {
      console.log(`${t.name} — ${t.description} (required: ${t.requiredFields.join(", ") || "none"})`);
    }
    return;
  }

  const template = args.template ?? "feature-section";
  const content: Record<string, unknown> = args.content ? JSON.parse(args.content) : {};
  for (const key of ["eyebrow", "headline", "body", "cta", "theme"]) {
    if (args[key] !== undefined) content[key] = args[key];
  }

  const result = await renderTemplate({
    template,
    content,
    imagePath: args.image,
    outPath: args.out,
    width: args.width ? Number(args.width) : undefined,
    height: args.height ? Number(args.height) : undefined,
  });

  console.log(`✓ Rendered ${template} → ${result.outPath} (${result.width}×${result.height}, ${(result.bytes / 1024).toFixed(0)} KB)`);
  process.exit(0);
}

// Run main() only when invoked directly (not when imported as a tool).
const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main().catch((err) => {
    console.error("✗", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
