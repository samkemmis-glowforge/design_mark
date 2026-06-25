import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Email header banner: "Introducing Premium Lab". Cream brand panel (left) with
 * the headline + logo, the Premium Lab scene (right), teal seam between.
 * Renders at 2x for retina email (1200xH displays at 600x(H/2)).
 */

const du = async (r: string, m: string) => `data:${m};base64,${(await readFile(resolve(REPO_ROOT, r))).toString("base64")}`;

async function render(W: number, H: number, outPath: string) {
  const logo = await du("brand/logo/logo-full-250.png", "image/png");
  const photo = await du("assets/campaign/premium-lab-src.png", "image/png");
  const panelW = Math.round(W * 0.40);
  const padX = Math.round(W * 0.05);
  const h1 = Math.round(H * 0.155);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--deep:#0E454D;--cream:#F9E7CB;--ink:#1C1813;}
    *{box-sizing:border-box;margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden;background:var(--cream)}
    .photo{position:absolute;left:${panelW}px;top:0;width:${W - panelW}px;height:${H}px;object-fit:cover;object-position:50% 52%}
    .panel{position:absolute;left:0;top:0;width:${panelW}px;height:${H}px;background:var(--cream);
      display:flex;flex-direction:column;justify-content:center;padding:0 ${padX}px}
    .seam{position:absolute;left:${panelW - 3}px;top:0;width:6px;height:${H}px;background:var(--teal)}
    .eyebrow{font-weight:800;font-size:${Math.round(H*0.045)}px;letter-spacing:.22em;text-transform:uppercase;color:var(--teal);margin-bottom:${Math.round(H*0.03)}px}
    .h1{font-weight:900;font-size:${h1}px;letter-spacing:-.03em;line-height:.95;color:var(--ink)}
    .h1 .em{color:var(--teal)}
    .logo{position:absolute;left:${padX}px;bottom:${Math.round(H*0.08)}px}
    .logo img{height:${Math.round(H*0.05)}px;display:block}
  </style></head><body>
    <div class="stage">
      <img class="photo" src="${photo}"/>
      <div class="panel">
        <div class="eyebrow">Introducing</div>
        <div class="h1">Premium<br/><span class="em">Lab</span></div>
      </div>
      <div class="seam"></div>
      <div class="logo"><img src="${logo}"/></div>
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath });
  await writeFile(outPath.replace(/\.png$/, ".checks.json"), JSON.stringify({ canvas: [W, H], check_motif: false,
    checks: [{ type: "contrast", name: "headline", region: [padX, Math.round(H*0.34), panelW - 2*padX, Math.round(H*0.4)], min: 4.5 }] }, null, 2));
  console.log(`✓ ${out.outPath}`);
}

async function main() {
  await render(1200, 600, "output/email-premium-lab-2x1.png"); // displays 600x300
  await render(1200, 400, "output/email-premium-lab-3x1.png"); // displays 600x200 (slim)
  process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
