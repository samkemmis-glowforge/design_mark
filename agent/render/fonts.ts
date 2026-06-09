import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * Brand fonts, embedded as base64 `@font-face` so rendering is deterministic and
 * fully offline (no Google Fonts CDN, which is blocked here).
 *
 * Today the brand ships on Inter (see brand.json typography). When the real brand
 * typeface arrives, add it here (drop a woff2 in /brand/fonts or install its
 * @fontsource package) and map the family name to its files.
 */
type FontFile = { weight: number; pkgPath: string };

const FONT_FILES: Record<string, FontFile[]> = {
  Inter: [
    { weight: 400, pkgPath: "@fontsource/inter/files/inter-latin-400-normal.woff2" },
    { weight: 500, pkgPath: "@fontsource/inter/files/inter-latin-500-normal.woff2" },
    { weight: 600, pkgPath: "@fontsource/inter/files/inter-latin-600-normal.woff2" },
    { weight: 700, pkgPath: "@fontsource/inter/files/inter-latin-700-normal.woff2" },
    { weight: 800, pkgPath: "@fontsource/inter/files/inter-latin-800-normal.woff2" },
    { weight: 900, pkgPath: "@fontsource/inter/files/inter-latin-900-normal.woff2" },
  ],
};

async function faceForFile(family: string, f: FontFile): Promise<string> {
  const abs = require.resolve(f.pkgPath);
  const b64 = (await readFile(abs)).toString("base64");
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}

/**
 * Returns `<style>` CSS embedding every requested font family.
 * Unknown families are skipped (they'll fall back to the system stack).
 */
export async function fontFaceStyles(families: string[]): Promise<string> {
  const unique = [...new Set(families)];
  const blocks: string[] = [];
  for (const family of unique) {
    const files = FONT_FILES[family];
    if (!files) continue;
    for (const f of files) blocks.push(await faceForFile(family, f));
  }
  return blocks.join("\n");
}

/** CSS font-family stack with sensible fallbacks. */
export function fontStack(primary: string): string {
  return `'${primary}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
}
