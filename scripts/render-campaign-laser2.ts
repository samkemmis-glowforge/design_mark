import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { SOCIAL, SocialFormat } from "../agent/render/social.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Campaign "A better design app for every laser" — v2 per notes:
 *  - no "Glowforge" in the copy (slogan only, no eyebrow/logo)
 *  - copy set DIRECTLY on the image over a teal-tinted top scrim
 *  - two base scenes: A) finished characters, B) characters in a design app + finished product
 * Emits all 4 ratios for each base.
 */

const du = async (r: string, m: string) => `data:${m};base64,${(await readFile(resolve(REPO_ROOT, r))).toString("base64")}`;

async function render(baseImg: string, pos: string, fmt: SocialFormat, outPath: string) {
  const S = SOCIAL[fmt]; const W = S.w, H = S.h;
  const wide = W > H;
  const photo = await du(baseImg, "image/png");
  const top = fmt === "story" ? S.safe.top : 56;
  const padX = S.safe.left;
  const big = wide ? 58 : (fmt === "ig-square" ? 66 : 74);

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--deep:#0E454D;--cream:#F9E7CB;--ink:#1C1813;}
    *{box-sizing:border-box;margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden;background:var(--deep)}
    .photo{position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;object-position:${pos}}
    /* teal-tinted top scrim so white copy holds over a bright, busy photo */
    .scrim{position:absolute;inset:0;background:linear-gradient(180deg, rgba(14,69,77,.86) 0%, rgba(14,69,77,.56) 30%, rgba(14,69,77,0) 56%)}
    .slogan{position:absolute;left:${padX}px;top:${top}px;font-weight:900;font-size:${big}px;letter-spacing:-.03em;line-height:.98;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.42)}
    .slogan .em{color:var(--cream)}
  </style></head><body>
    <div class="stage">
      <img class="photo" src="${photo}"/>
      <div class="scrim"></div>
      <div class="slogan">A better<br/>design app for<br/><span class="em">every laser.</span></div>
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath });
  const lineH = big * 0.98;
  await writeFile(outPath.replace(/\.png$/, ".checks.json"), JSON.stringify({ canvas: [W, H], check_motif: false,
    checks: [{ type: "contrast", name: "slogan", region: [padX, top, Math.round(W * 0.62), Math.round(lineH * 3 + 12)], min: 4.5 }] }, null, 2));
  console.log(`✓ ${out.outPath}`);
}

const RATIOS: [SocialFormat, string][] = [
  ["ig-square", "1x1"], ["ig-portrait", "4x5"], ["story", "9x16"], ["fb-link", "191"],
];

async function main() {
  const bases = [
    { key: "chars",  img: "assets/campaign/chars-clean.png",     pos: "50% 50%" },
    { key: "design", img: "assets/campaign/designapp-clean.png", pos: "50% 50%" },
  ];
  // The wide design scene doesn't fit a narrow 9:16; bias left to keep the full
  // app screen + the fox figure instead of clipping the bunny at the edge.
  const posOverride: Record<string, string> = { "design-9x16": "36% 50%" };
  for (const b of bases)
    for (const [fmt, tag] of RATIOS)
      await render(b.img, posOverride[`${b.key}-${tag}`] ?? b.pos, fmt, `output/laser-${b.key}-${tag}.png`);
  process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
