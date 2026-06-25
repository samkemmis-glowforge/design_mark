import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { SOCIAL, SocialFormat } from "../agent/render/social.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Campaign: "A better design app for every laser" (software / works-with-any-laser).
 * Hero = the catalog "millennimal coffee" finished-project photo; slogan lives in a
 * deep-teal panel (bottom band for tall/square, left panel for wide). Emits all 4 ratios.
 */

const du = async (r: string, m: string) => `data:${m};base64,${(await readFile(resolve(REPO_ROOT, r))).toString("base64")}`;

// per-format band/panel size (px) for the non-wide stacked layout
const BAND: Partial<Record<SocialFormat, number>> = {
  "ig-square": 408, "ig-portrait": 470, story: 720,
};

async function render(fmt: SocialFormat, outPath: string) {
  const S = SOCIAL[fmt]; const W = S.w, H = S.h;
  const wide = W > H;
  const logo = await du("brand/logo/logo-full-250.png", "image/png");
  const photo = await du("assets/campaign/app-catalog.png", "image/png");

  // geometry
  const panelW = wide ? Math.round(W * 0.46) : 0;          // wide: left panel width
  const bandH = wide ? 0 : (BAND[fmt] ?? 420);             // tall/square: bottom band height
  const photoBox = wide
    ? `left:${panelW}px;top:0;width:${W - panelW}px;height:${H}px`
    : `left:0;top:0;width:${W}px;height:${H - bandH}px`;
  const panelBox = wide
    ? `left:0;top:0;width:${panelW}px;height:${H}px`
    : `left:0;top:${H - bandH}px;width:${W}px;height:${bandH}px`;

  // slogan type scale
  const big = wide ? 60 : (fmt === "ig-square" ? 66 : 74);
  const padX = wide ? 56 : S.safe.left;
  const padY = wide ? 0 : 52;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--teallt:#9fd4db;--deep:#0E454D;--cream:#F9E7CB;--ink:#1C1813;}
    *{box-sizing:border-box;margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden;background:var(--deep)}
    .photo{position:absolute;${photoBox};object-fit:cover;object-position:50% 46%}
    .panel{position:absolute;${panelBox};background:var(--deep);display:flex;flex-direction:column;justify-content:${wide ? "center" : "flex-start"};padding:${padY}px ${padX}px}
    /* crisp seam between photo and panel */
    .seam{position:absolute;${wide ? `left:${panelW - 3}px;top:0;width:6px;height:${H}px` : `left:0;top:${H - bandH - 3}px;width:${W}px;height:6px`};background:var(--teal)}
    .eyebrow{font-weight:800;font-size:18px;letter-spacing:.22em;text-transform:uppercase;color:var(--teallt);margin-bottom:16px}
    .slogan{font-weight:900;font-size:${big}px;letter-spacing:-.03em;line-height:.98;color:#fff}
    .slogan .em{color:var(--cream)}
    .logo{position:absolute;${wide ? `right:48px;top:40px` : `left:${S.safe.left}px;top:40px`};background:rgba(255,255,255,.92);border-radius:12px;padding:9px 13px}
    .logo img{height:30px;display:block}
  </style></head><body>
    <div class="stage">
      <img class="photo" src="${photo}"/>
      <div class="seam"></div>
      <div class="panel">
        <div class="eyebrow">The Glowforge App</div>
        <div class="slogan">A better<br/>design app for<br/><span class="em">every laser.</span></div>
      </div>
      <div class="logo"><img src="${logo}"/></div>
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath });
  // contrast region: white slogan over deep-teal panel
  const region = wide ? [padX, Math.round(H/2 - 80), panelW - padX - 20, 200]
                      : [padX, H - bandH + 70, W - 2*padX, 220];
  await writeFile(outPath.replace(/\.png$/, ".checks.json"), JSON.stringify({ canvas: [W, H], check_motif: false,
    checks: [{ type: "contrast", name: "slogan", region, min: 4.5 }] }, null, 2));
  console.log(`✓ ${out.outPath}`);
}

async function main() {
  await render("ig-square", "output/laser-1x1.png");
  await render("ig-portrait", "output/laser-4x5.png");
  await render("story", "output/laser-9x16.png");
  await render("fb-link", "output/laser-191.png");
  process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
