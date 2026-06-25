import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { SOCIAL, SocialFormat } from "../agent/render/social.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Normalize the Gemini-rendered bubble scenes (bubbles + hand-lettered text) to
 * exact platform dimensions. Same-aspect sources just upscale; the 16:9 source is
 * cover-cropped to 1.91:1 anchored to the TOP so the speech bubbles are preserved.
 */

const du = async (r: string, m: string) => `data:${m};base64,${(await readFile(resolve(REPO_ROOT, r))).toString("base64")}`;

async function render(src: string, fmt: SocialFormat, outPath: string, pos: string) {
  const S = SOCIAL[fmt]; const W = S.w, H = S.h;
  const img = await du(src, "image/png");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#eee}
    img{position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;object-position:${pos}}
  </style></head><body><div class="stage"><img src="${img}"/></div></body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath });
  await writeFile(outPath.replace(/\.png$/, ".checks.json"), JSON.stringify({ canvas: [W, H], check_motif: false, checks: [] }, null, 2));
  console.log(`✓ ${out.outPath}`);
}

async function main() {
  await render("assets/campaign/chars-bubbles-text.png",      "ig-square",   "output/laser-bubbles-1x1.png",  "50% 50%");
  await render("assets/campaign/chars-bubbles-text-4x5.png",  "ig-portrait", "output/laser-bubbles-4x5.png",  "50% 50%");
  await render("assets/campaign/chars-bubbles-text-9x16.png", "story",       "output/laser-bubbles-9x16.png", "50% 50%");
  await render("assets/campaign/chars-bubbles-text-16x9.png", "fb-link",     "output/laser-bubbles-191.png",  "50% 0%");
  process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
