import { loadBrand, brandFontFamilies } from "../brand.js";
import { fontFaceStyles } from "../render/fonts.js";
import { htmlToPng, type HtmlToPngResult } from "../render/html-to-png.js";

/**
 * Render agent-authored SVG or HTML to PNG. This is the route for crisp text, exact
 * layout, and a vector look — image models smear text and miss precise layout; code
 * does not. The markup is inlined into a document that embeds the brand fonts, so
 * `font-family: Inter` in the agent's SVG/HTML renders sharp and on-brand.
 */

export interface RenderSvgInput {
  /** Agent-authored SVG (<svg …>) or HTML (fragment or full document). */
  markup: string;
  width?: number;
  height?: number;
  outPath?: string;
  /** Keep the PNG background transparent (for layer/sticker exports). */
  omitBackground?: boolean;
}

function looksLikeSvg(markup: string): boolean {
  return /^\s*(<\?xml[^>]*\?>\s*)?<svg[\s>]/i.test(markup);
}

function looksLikeFullDoc(markup: string): boolean {
  return /^\s*(<!doctype html|<html[\s>])/i.test(markup);
}

export async function renderSvg(input: RenderSvgInput): Promise<HtmlToPngResult> {
  const brand = await loadBrand();
  const width = input.width ?? 1080;
  const height = input.height ?? 1080;
  const fontFaceCSS = await fontFaceStyles(brandFontFamilies(brand));
  const markup = input.markup.trim();

  let html: string;
  if (looksLikeFullDoc(markup)) {
    // Inject brand @font-face into the existing <head> so text is deterministic.
    const style = `<style>${fontFaceCSS}</style>`;
    html = markup.replace(/<head([^>]*)>/i, `<head$1>${style}`);
    if (!/<head/i.test(markup)) {
      html = markup.replace(/<html([^>]*)>/i, `<html$1><head>${style}</head>`);
    }
  } else if (looksLikeSvg(markup)) {
    // Inline the SVG so it shares the document's embedded fonts; size it to the viewport.
    html = `<!doctype html><html><head><meta charset="utf-8"><style>
      ${fontFaceCSS}
      html,body{margin:0;padding:0}
      svg{display:block;width:${width}px;height:${height}px}
    </style></head><body>${markup}</body></html>`;
  } else {
    // Treat as an HTML fragment.
    html = `<!doctype html><html><head><meta charset="utf-8"><style>
      ${fontFaceCSS}
      *{margin:0;box-sizing:border-box}
      html,body{width:100%;height:100%}
    </style></head><body>${markup}</body></html>`;
  }

  const outPath = input.outPath ?? `output/graphic-${Date.now()}.png`;
  return htmlToPng({ html, width, height, outPath, omitBackground: input.omitBackground });
}
