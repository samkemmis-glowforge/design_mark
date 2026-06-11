import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * JUST LIKE THAT — "lockup" layout. Editorial palette (near-white / ink / teal).
 *
 * Left two-thirds: a single typographic lockup — three giant lines, flush
 * left, tight pitch; each step image is a circle set INLINE in its line at
 * cap height (word↔step pairing lives inside the typesetting, no scatter,
 * no orphan whitespace). Tagline closes the block on the same margin.
 *
 * Right third: full-height product panel — the lifestyle coaster scene with
 * the engraving BIG and the Pacifico name readable. One focal point; the
 * lockup reads down, the eye lands on the payoff. No CTA.
 */

const W = 1920;
const H = 1080;

async function dataUri(absOrRel: string, mime: string): Promise<string> {
  const p = absOrRel.startsWith("/") ? absOrRel : resolve(REPO_ROOT, absOrRel);
  return `data:${mime};base64,${(await readFile(p)).toString("base64")}`;
}

async function main() {
  // landing page header carries the logo
  // const logo = await dataUri("brand/logo/logo-full-250.png", "image/png");
  const photo = await dataUri("assets/magic-engraver/milo2.jpg", "image/jpeg");
  const engraving = await dataUri("assets/magic-engraver/milo-engrave2.png", "image/png");
  const burnt = await dataUri("/tmp/milo/engrave2-burnt.png", "image/png");
  const scene = await dataUri("/tmp/milo/coaster-scene.png", "image/png");
  const pacifico = (
    await readFile(resolve(REPO_ROOT, "node_modules/@fontsource/pacifico/files/pacifico-latin-400-normal.woff2"))
  ).toString("base64");

  // Right panel: scene scaled so the coaster face is the hero (~494px dia).
  const panelW = 680;
  const ps = 1150 / 1024;
  const panelLeft = panelW / 2 - 497 * ps;
  const panelTop = H / 2 - 527 * ps;

  // Inline coaster circle: face fills the 220px circle.
  const cs = 0.52;
  const D = 220;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:'Pacifico';src:url(data:font/woff2;base64,${pacifico}) format('woff2')}
    :root{--teal:#16A0B0;--ink:#1C1813;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;background:#FDF8F1;
      font-family:'Inter',sans-serif;overflow:hidden}

    /* ---- the lockup ---- */
    .line{position:absolute;left:84px;display:flex;align-items:center;gap:46px}
    .w{font-weight:900;font-size:240px;letter-spacing:-0.045em;color:var(--ink);
      white-space:nowrap;line-height:1}
    .w.outline{color:transparent;-webkit-text-stroke:5px var(--ink)}
    .dot{width:${D}px;height:${D}px;border-radius:50%;overflow:hidden;
      border:5px solid var(--ink);position:relative;flex:none;background:#fff}
    .dot img{display:block}

    .tagline{position:absolute;left:84px;top:962px;font-weight:600;font-size:27px;
      color:var(--ink);letter-spacing:-0.01em}

    /* ---- product panel ---- */
    .panel{position:absolute;right:0;top:0;width:${panelW}px;height:${H}px;overflow:hidden}
    .panel .scene{position:absolute;left:${panelLeft}px;top:${panelTop}px;height:1150px}
    .panel .eng{position:absolute;left:${panelW / 2 - 152}px;top:${H / 2 - 218}px;width:304px;
      mix-blend-mode:multiply;opacity:0.9}
    .panel .nm{position:absolute;left:0;right:0;top:${H / 2 + 168}px;text-align:center;
      font-family:'Pacifico';font-size:58px;color:#2a1408;mix-blend-mode:multiply;opacity:0.92}

    .eyebrow{position:absolute;z-index:5;top:56px;left:84px;font-weight:800;
      font-size:21px;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink)}
    .logo{position:absolute;z-index:5;top:48px;right:60px}
    .logo img{height:40px;display:block;filter:brightness(0) invert(1);
      opacity:0.95}
    .arrow{position:absolute;z-index:4}
  </style></head><body>
    <div class="stage">
      <div class="panel">
        <img class="scene" src="${scene}"/>
        <img class="eng" src="${burnt}"/>
        <div class="nm">Milo</div>
      </div>

      <div class="line" style="top:150px">
        <span class="w">JUST</span>
        <span class="dot"><img src="${photo}" style="width:150%;height:150%;object-fit:cover;object-position:center 8%;margin:-8% 0 0 -25%"/></span>
      </div>
      <div class="line" style="top:420px">
        <span class="w outline">LIKE</span>
        <span class="dot"><img src="${engraving}" style="width:364px;margin:-10px 0 0 -72px"/></span>
      </div>
      <div class="line" style="top:690px">
        <span class="w">THAT</span>
        <span class="dot">
          <img src="${scene}" style="position:absolute;left:${D / 2 - 497 * cs}px;top:${D / 2 - 527 * cs}px;height:${1024 * cs}px"/>
          <img src="${burnt}" style="position:absolute;left:${D / 2 - 64}px;top:${D / 2 - 92}px;width:128px;mix-blend-mode:multiply;opacity:0.9"/>
        </span>
      </div>

      <svg class="arrow" style="left:1056px;top:806px" width="240" height="120" viewBox="0 0 240 120"
           fill="none" stroke="#16A0B0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 14 96 C 80 96, 150 70, 212 28" stroke-dasharray="2 24"/>
        <path d="M 158 22 L 220 22 L 206 80"/>
      </svg>

      <div class="tagline">One photo in. An heirloom out.</div>
      <div class="eyebrow">Magic Engraver</div>
    </div>
  </body></html>`;

  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/jlt-lockup.png" });
  console.log(`✓ ${out.outPath} (${out.width}×${out.height}, ${(out.bytes / 1024) | 0} KB)`);
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
