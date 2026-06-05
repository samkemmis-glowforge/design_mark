import { loadBrand, brandFontFamilies } from "../brand.js";
import { fontFaceStyles, fontStack } from "../render/fonts.js";
import { htmlToPng } from "../render/html-to-png.js";
import { dimsFor, type ImageProvider, type ImageRequest, type ImageResult } from "./image-types.js";
import { geminiProvider } from "./providers/gemini.js";

export type { AspectRatio, ImageProvider, ImageRequest, ImageResult } from "./image-types.js";
export { dimsFor } from "./image-types.js";

/**
 * Image generation behind ONE pluggable interface (per the build plan: "wrap behind
 * one tool interface so the provider can be swapped").
 *
 * IMPORTANT: this route is only for photoreal / lifestyle scenes. Layout assets go
 * to render_template; crisp-text/vector graphics go to render_svg. For our actual
 * product UI, composite a real screenshot rather than generating the interface.
 *
 * Providers are selected by the IMAGE_PROVIDER env var. The default "placeholder"
 * provider is deterministic and offline — it produces an on-brand stand-in card so
 * the whole pipeline works without an external image API.
 */

/**
 * Default provider: renders a deterministic, on-brand placeholder that states the
 * prompt and references. Lets the agent's photoreal route produce a visible asset
 * offline; swapping in a real model is just `IMAGE_PROVIDER=gemini`.
 */
const placeholderProvider: ImageProvider = {
  name: "placeholder",
  async generate(req) {
    const brand = await loadBrand();
    const { width, height } = dimsFor(req.aspectRatio);
    const fontFaceCSS = await fontFaceStyles(brandFontFamilies(brand));
    const p = brand.palette;
    const refs = req.references?.length
      ? `<div class="refs">style refs: ${req.references.map((r) => r.split("/").pop()).join(", ")}</div>`
      : "";
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      ${fontFaceCSS}
      *{margin:0;box-sizing:border-box}
      body{width:100%;height:100%;font-family:${fontStack(brand.typography.bodyFont)};
        background:linear-gradient(135deg, ${p.teal.shade} 0%, ${p.purple.shade} 100%);
        color:#fff;display:flex;align-items:center;justify-content:center;padding:64px}
      .card{max-width:80%;text-align:center}
      .tag{font-family:${fontStack(brand.typography.headingFont)};text-transform:uppercase;
        letter-spacing:0.16em;font-size:14px;opacity:0.7;margin-bottom:20px}
      .prompt{font-family:${fontStack(brand.typography.headingFont)};font-weight:600;
        font-size:30px;line-height:1.25}
      .refs{margin-top:24px;font-size:14px;opacity:0.65}
      .meta{margin-top:8px;font-size:13px;opacity:0.5}
    </style></head><body>
      <div class="card">
        <div class="tag">generated scene · placeholder</div>
        <div class="prompt">${escapeHtml(req.prompt)}</div>
        ${refs}
        <div class="meta">${width}×${height} · set IMAGE_PROVIDER=gemini for a real scene</div>
      </div>
    </body></html>`;
    const res = await htmlToPng({ html, width, height, outPath: req.outPath });
    return { outPath: res.outPath, width: res.width, height: res.height, provider: this.name };
  },
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const PROVIDERS: Record<string, ImageProvider> = {
  placeholder: placeholderProvider,
  gemini: geminiProvider,
  // openai: openaiProvider,   // add more backends here
};

export function getImageProvider(): ImageProvider {
  const name = process.env.IMAGE_PROVIDER ?? "placeholder";
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(`Unknown IMAGE_PROVIDER "${name}". Available: ${Object.keys(PROVIDERS).join(", ")}`);
  }
  return provider;
}

/** Generate a photoreal/lifestyle image via the configured provider. */
export async function generateImage(
  req: Omit<ImageRequest, "outPath"> & { outPath?: string },
): Promise<ImageResult> {
  const provider = getImageProvider();
  const outPath = req.outPath ?? `output/scene-${Date.now()}.png`;
  return provider.generate({ ...req, outPath });
}
