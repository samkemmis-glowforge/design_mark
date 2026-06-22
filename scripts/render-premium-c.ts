import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { SOCIAL } from "../agent/render/social.js";
import { REPO_ROOT } from "../agent/brand.js";

const S = SOCIAL["ig-square"]; const W = S.w, H = S.h;
const du = async (r: string, m: string) => `data:${m};base64,${(await readFile(resolve(REPO_ROOT, r))).toString("base64")}`;

async function main() {
  const logo = await du("brand/logo/logo-full-250.png", "image/png");
  const life = await du("assets/premium/lifestyle-minimal.png", "image/png");
  const scale = W / 1024; const w = 1024 * scale;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden;background:#fff}
    .scene{position:absolute;left:0;top:${((H - w) / 2).toFixed(0)}px;width:${w}px}
    /* soft warm lift in lower-left so ink type stays legible without a heavy scrim */
    .veil{position:absolute;inset:0;background:radial-gradient(135% 105% at 6% 106%, rgba(249,231,203,.97) 0%, rgba(249,231,203,.62) 40%, rgba(249,231,203,0) 66%)}
    .eyebrow{position:absolute;top:64px;left:72px;font-weight:800;font-size:21px;letter-spacing:.2em;text-transform:uppercase;color:#fff;text-shadow:0 1px 8px rgba(28,24,19,.35)}
    .logo{position:absolute;top:58px;right:72px}.logo img{height:32px;display:block;filter:drop-shadow(0 1px 6px rgba(28,24,19,.35))}
    .h1{position:absolute;left:72px;bottom:172px;font-weight:900;font-size:96px;letter-spacing:-.03em;line-height:.96;color:var(--ink)}
    .sub{position:absolute;left:74px;bottom:118px;font-weight:700;font-size:26px;color:var(--ink);opacity:.8}
  </style></head><body>
    <div class="stage">
      <img class="scene" src="${life}"/>
      <div class="veil"></div>
      <div class="eyebrow">Glowforge Premium</div>
      <div class="logo"><img src="${logo}"/></div>
      <div class="h1">Made easier<br/>with Premium.</div>
      <div class="sub">From idea to finished piece — faster.</div>
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/premium-c-outcome.png" });
  await writeFile("output/premium-c-outcome.checks.json", JSON.stringify({ canvas: [W, H],
    checks: [{ type: "contrast", name: "headline", region: [72, H - 280, 640, 200], min: 4.5 }] }, null, 2));
  console.log(`✓ ${out.outPath}`); process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
