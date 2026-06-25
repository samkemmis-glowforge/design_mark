import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/** Proofgrade sale promo (1:1): "Up to 50% off Proofgrade". White hero, bold ink
 *  headline with a teal accent, the material stack anchored below. */

const du = async (r: string, m: string) => `data:${m};base64,${(await readFile(resolve(REPO_ROOT, r))).toString("base64")}`;

async function main() {
  const W = 1080, H = 1080;
  const logo = await du("brand/logo/logo-full-250.png", "image/png");
  const photo = await du("assets/campaign/proofgrade-src.jpg", "image/jpeg");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--deep:#0E454D;--cream:#F9E7CB;--ink:#1C1813;}
    *{box-sizing:border-box;margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden;background:#fff}
    /* material stack: full width, anchored to the bottom; its own white blends with the stage */
    .photo{position:absolute;left:50%;bottom:-150px;transform:translateX(-50%);width:1400px}
    .txt{position:absolute;top:0;left:0;width:${W}px;text-align:center}
    .eyebrow{margin-top:104px;font-weight:800;font-size:30px;letter-spacing:.26em;text-transform:uppercase;color:var(--deep)}
    .big{margin-top:14px;font-weight:900;font-size:158px;letter-spacing:-.04em;line-height:.9;color:var(--ink)}
    .rule{width:300px;height:12px;background:var(--teal);border-radius:8px;margin:22px auto 0}
    .prod{margin-top:22px;font-weight:800;font-size:58px;letter-spacing:-.01em;color:var(--ink)}
    .logo{position:absolute;left:50%;transform:translateX(-50%);top:474px}
    .logo img{height:34px;display:block;opacity:.9}
  </style></head><body>
    <div class="stage">
      <img class="photo" src="${photo}"/>
      <div class="txt">
        <div class="eyebrow">Up&nbsp;to</div>
        <div class="big">50% OFF</div>
        <div class="rule"></div>
        <div class="prod">Proofgrade</div>
      </div>
      <div class="logo"><img src="${logo}"/></div>
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/proofgrade-1x1.png" });
  await writeFile("output/proofgrade-1x1.checks.json", JSON.stringify({ canvas: [W, H], check_motif: false,
    checks: [{ type: "contrast", name: "headline", region: [340, 150, 400, 150], min: 4.5 }] }, null, 2));
  console.log(`✓ ${out.outPath}`); process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
