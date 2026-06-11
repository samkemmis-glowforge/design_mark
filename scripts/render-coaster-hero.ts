import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * "Magic Engraver" coaster hero — concept: THE CIRCLE GAME.
 *
 * The round coaster sets the visual language: Milo's new engraving blown up
 * huge as ink-on-cream background texture; a big circular porthole into a
 * warm lifestyle scene (Gemini walnut coaster + real engraving composited,
 * burnt tone, Pacifico name); the phone photo as a round sticker chip.
 * Headline owns the calm cream zone at left.
 *
 * Restraint: cream + ink; teal only on ring/arrow/sparkles/CTA; the porthole
 * scene is the single full-color moment, the chip the single photo.
 */

const W = 1920;
const H = 1080;

async function dataUri(absOrRel: string, mime: string): Promise<string> {
  const p = absOrRel.startsWith("/") ? absOrRel : resolve(REPO_ROOT, absOrRel);
  const b64 = (await readFile(p)).toString("base64");
  return `data:${mime};base64,${b64}`;
}

const sparkle = (s: number, rot = 0) => `
<svg width="${s}" height="${s}" viewBox="0 0 60 60" fill="none" stroke="#16A0B0"
     stroke-width="6" stroke-linecap="round" style="transform:rotate(${rot}deg)">
  <path d="M30 6 C 31 18, 32 24, 33 28 C 42 30, 48 31, 54 31 C 46 34, 39 36, 33 37 C 31 45, 30 50, 29 56 C 28 48, 27 41, 26 36 C 18 34, 12 33, 6 31 C 14 29, 21 28, 27 27 C 28 20, 29 13, 30 6 Z"/>
</svg>`;

async function main() {
  const logo = await dataUri("brand/logo/logo-full-250.png", "image/png");
  const photo = await dataUri("assets/magic-engraver/milo2.jpg", "image/jpeg");
  const engraving = await dataUri("assets/magic-engraver/milo-engrave2.png", "image/png");
  const burnt = await dataUri("/tmp/milo/engrave2-burnt.png", "image/png");
  const scene = await dataUri("/tmp/milo/coaster-scene.png", "image/png");
  const pacifico = (
    await readFile(resolve(REPO_ROOT, "node_modules/@fontsource/pacifico/files/pacifico-latin-400-normal.woff2"))
  ).toString("base64");

  // Porthole geometry: 640px circle; scene's coaster face (center 497,527 r~220
  // in the 1024px image) scaled and offset so the face centers in the porthole.
  const D = 640;
  const sceneScale = 0.8;
  const sceneW = 1024 * sceneScale;
  const sceneLeft = D / 2 - 497 * sceneScale;
  const sceneTop = D / 2 - 527 * sceneScale;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:'Pacifico';src:url(data:font/woff2;base64,${pacifico}) format('woff2')}
    :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;background:var(--cream);
      font-family:'Inter',sans-serif;overflow:hidden}

    /* ---- engraving as background texture (ink on cream via multiply) ---- */
    .texture{position:absolute;z-index:1;left:700px;top:-120px;height:1400px;
      mix-blend-mode:multiply;opacity:0.95}

    /* ---- the porthole: circular window into the lifestyle scene ---- */
    .porthole{position:absolute;z-index:3;left:950px;top:240px;width:${D}px;height:${D}px;
      border-radius:50%;overflow:hidden;box-shadow:-16px 20px 0 rgba(28,24,19,0.18)}
    .porthole .scene{position:absolute;left:${sceneLeft}px;top:${sceneTop}px;width:${sceneW}px}
    .porthole .eng{position:absolute;left:${D / 2 - 108}px;top:${D / 2 - 152}px;width:216px;
      mix-blend-mode:multiply;opacity:0.9}
    .porthole .nm{position:absolute;left:0;right:0;top:${D / 2 + 122}px;text-align:center;
      font-family:'Pacifico';font-size:46px;color:#2a1408;
      mix-blend-mode:multiply;opacity:0.92}

    /* ---- hand-drawn teal ring orbiting the porthole ---- */
    .ring{position:absolute;z-index:4;left:910px;top:200px}

    /* ---- round photo sticker ---- */
    .chip{position:absolute;z-index:5;left:120px;top:120px;width:210px;height:210px;
      border-radius:50%;overflow:hidden;border:9px solid #fff;
      box-shadow:-8px 10px 0 rgba(28,24,19,0.18)}
    .chip img{width:100%;height:100%;object-fit:cover;object-position:center 18%}
    .chip-cap{position:absolute;z-index:5;left:104px;top:352px;width:250px;text-align:center;
      font-size:17px;font-style:italic;font-weight:600;color:var(--ink)}

    .arrow{position:absolute;z-index:4}
    .doodle{position:absolute;z-index:4}

    /* ---- headline / copy / CTA in the calm zone ---- */
    .h1{position:absolute;z-index:2;left:84px;top:470px;font-weight:900;font-size:104px;
      letter-spacing:-0.03em;color:var(--ink);white-space:nowrap}
    .h2{position:absolute;z-index:2;left:84px;top:590px;font-weight:400;font-size:104px;
      letter-spacing:-0.03em;color:var(--ink);white-space:nowrap}
    .sub{position:absolute;z-index:2;left:84px;top:742px;font-weight:600;font-size:25px;
      color:var(--ink);opacity:0.85}
    .cta{position:absolute;z-index:5;left:84px;top:806px;background:var(--teal);color:#fff;
      font-weight:800;font-size:22px;letter-spacing:0.02em;padding:16px 32px;
      border-radius:999px;box-shadow:-6px 8px 0 rgba(28,24,19,0.20)}

    .eyebrow{position:absolute;z-index:5;top:56px;left:84px;font-weight:800;
      font-size:21px;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink)}
    .logo{position:absolute;z-index:5;top:48px;right:84px}
    .logo img{height:40px;display:block}
  </style></head><body>
    <div class="stage">
      <img class="texture" src="${engraving}"/>

      <div class="porthole">
        <img class="scene" src="${scene}"/>
        <img class="eng" src="${burnt}"/>
        <div class="nm">Milo</div>
      </div>

      <svg class="ring" width="720" height="720" viewBox="0 0 720 720" fill="none"
           stroke="#16A0B0" stroke-width="7" stroke-linecap="round">
        <path d="M 360 28 C 545 30, 692 178, 690 362 C 688 548, 542 692, 358 690"/>
        <path d="M 318 686 C 150 660, 32 520, 30 358 C 28 196, 152 52, 314 32"/>
      </svg>

      <div class="chip"><img src="${photo}"/></div>
      <div class="chip-cap">started as this phone pic</div>

      <svg class="arrow" style="left:350px;top:240px" width="560" height="220" viewBox="0 0 560 220"
           fill="none" stroke="#16A0B0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 16 60 C 200 20, 420 60, 540 170" stroke-dasharray="2 26"/>
        <path d="M 502 124 L 546 176 L 474 188"/>
      </svg>

      <div class="doodle" style="top:208px;left:880px">${sparkle(48, 10)}</div>
      <div class="doodle" style="top:120px;left:380px">${sparkle(34, -14)}</div>

      <div class="h1">One good boy.</div>
      <div class="h2">Every morning.</div>
      <div class="sub">One photo in. An heirloom out.</div>
      <span class="cta">Try Magic Engraver</span>

      <div class="eyebrow">Magic Engraver</div>
      <div class="logo"><img src="${logo}" alt="Glowforge"/></div>
    </div>
  </body></html>`;

  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/coaster-hero.png" });
  console.log(`✓ ${out.outPath} (${out.width}×${out.height}, ${(out.bytes / 1024) | 0} KB)`);
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
