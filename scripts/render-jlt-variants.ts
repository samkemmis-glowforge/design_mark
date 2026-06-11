import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * JUST LIKE THAT — style/art-direction variants on the locked staircase
 * geometry (word ↔ step pairing: JUST+photo, LIKE+engraving, THAT+coaster).
 * No CTA (lands on a page that already has them). Renders three treatments:
 *
 *   A "house cream"   — cream field, ink type, teal doodles (approved style,
 *                       new assets)
 *   B "night teal"    — deep teal field, cream type/lines, yellow doodles,
 *                       the warm coaster scene as the single warm pop
 *   C "editorial"     — near-white, flat, numbered steps, LIKE outlined,
 *                       thin rules, quiet teal
 */

const W = 1920;
const H = 1080;

async function dataUri(absOrRel: string, mime: string): Promise<string> {
  const p = absOrRel.startsWith("/") ? absOrRel : resolve(REPO_ROOT, absOrRel);
  return `data:${mime};base64,${(await readFile(p)).toString("base64")}`;
}

const sparkle = (s: number, color: string, rot = 0) => `
<svg width="${s}" height="${s}" viewBox="0 0 60 60" fill="none" stroke="${color}"
     stroke-width="6" stroke-linecap="round" style="transform:rotate(${rot}deg)">
  <path d="M30 6 C 31 18, 32 24, 33 28 C 42 30, 48 31, 54 31 C 46 34, 39 36, 33 37 C 31 45, 30 50, 29 56 C 28 48, 27 41, 26 36 C 18 34, 12 33, 6 31 C 14 29, 21 28, 27 27 C 28 20, 29 13, 30 6 Z"/>
</svg>`;

interface Style {
  name: string;
  bg: string;
  type: string; // word color
  likeExtra: string; // extra CSS for the LIKE word
  accent: string; // doodles/arrows
  dog: string; // which cutout
  chipBorder: string;
  shadow: string; // box-shadow value or "none"
  numerals: boolean;
  logoFilter: string;
}

async function main() {
  const logo = await dataUri("brand/logo/logo-full-250.png", "image/png");
  const photo = await dataUri("assets/magic-engraver/milo2.jpg", "image/jpeg");
  const dogCream = await dataUri("/tmp/milo/m2-cut-cream.png", "image/png");
  const dogTeal = await dataUri("/tmp/milo/m2-cut-teal.png", "image/png");
  const burnt = await dataUri("/tmp/milo/engrave2-burnt.png", "image/png");
  const scene = await dataUri("/tmp/milo/coaster-scene.png", "image/png");
  const pacifico = (
    await readFile(resolve(REPO_ROOT, "node_modules/@fontsource/pacifico/files/pacifico-latin-400-normal.woff2"))
  ).toString("base64");

  const styles: Style[] = [
    {
      name: "a-house-cream", bg: "#F9E7CB", type: "#1C1813", likeExtra: "",
      accent: "#16A0B0", dog: dogCream, chipBorder: "9px solid #fff",
      shadow: "-9px 12px 0 rgba(28,24,19,0.18)", numerals: false, logoFilter: "none",
    },
    {
      name: "b-night-teal", bg: "#0E454D", type: "#F9E7CB", likeExtra: "",
      accent: "#FFE677", dog: dogTeal, chipBorder: "9px solid #F9E7CB",
      shadow: "-9px 12px 0 rgba(0,0,0,0.35)", numerals: false, logoFilter: "brightness(0) invert(1)",
    },
    {
      name: "c-editorial", bg: "#FDF8F1", type: "#1C1813",
      likeExtra: "color:transparent;-webkit-text-stroke:5px #1C1813;",
      accent: "#16A0B0", dog: dogCream, chipBorder: "5px solid #1C1813",
      shadow: "none", numerals: true, logoFilter: "none",
    },
  ];

  for (const s of styles) {
    const num = (n: string) =>
      s.numerals
        ? `<span style="position:absolute;top:-34px;left:8px;font-weight:700;font-size:24px;
             letter-spacing:0.12em;color:${s.accent}">${n}</span>`
        : "";

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:'Pacifico';src:url(data:font/woff2;base64,${pacifico}) format('woff2')}
      html,body{margin:0;padding:0}
      .stage{position:relative;width:${W}px;height:${H}px;background:${s.bg};
        font-family:'Inter',sans-serif;overflow:hidden}
      .word{position:absolute;z-index:1;font-weight:900;font-size:280px;
        letter-spacing:-0.045em;color:${s.type};white-space:nowrap;line-height:1}
      .chip{position:absolute;z-index:5;left:872px;top:96px;width:236px;height:236px;
        border-radius:50%;overflow:hidden;border:${s.chipBorder};box-shadow:${s.shadow}}
      .chip img{width:100%;height:100%;object-fit:cover;object-position:center 18%}
      .cap{position:absolute;z-index:5;left:846px;top:352px;width:300px;text-align:center;
        font-size:17px;font-style:italic;font-weight:600;color:${s.type}}
      .milo{position:absolute;z-index:3;right:24px;bottom:-14px;width:500px}
      .milo img{display:block;width:100%;height:auto;
        ${s.shadow === "none" ? "" : `filter:drop-shadow(-12px 14px 0 ${s.name === "b-night-teal" ? "rgba(0,0,0,0.35)" : "rgba(28,24,19,0.18)"})`}}
      .coaster{position:absolute;z-index:5;left:880px;top:688px;width:340px;height:340px;
        border-radius:50%;overflow:hidden;box-shadow:${s.shadow}}
      .coaster .scene{position:absolute;left:${170 - 497 * 0.62}px;top:${170 - 527 * 0.62}px;width:${1024 * 0.62}px}
      .coaster .eng{position:absolute;left:${170 - 53}px;top:${170 - 76}px;width:106px;
        mix-blend-mode:multiply;opacity:0.9}
      .coaster .nm{position:absolute;left:0;right:0;top:${170 + 62}px;text-align:center;
        font-family:'Pacifico';font-size:24px;color:#2a1408;mix-blend-mode:multiply;opacity:0.92}
      .swoosh{position:absolute;z-index:2;inset:0}
      .doodle{position:absolute;z-index:4}
      .eyebrow{position:absolute;z-index:5;top:56px;left:84px;font-weight:800;
        font-size:21px;letter-spacing:0.24em;text-transform:uppercase;color:${s.type}}
      .logo{position:absolute;z-index:5;top:48px;right:84px}
      .logo img{height:40px;display:block;filter:${s.logoFilter}}
      .tagline{position:absolute;z-index:5;right:84px;top:142px;font-weight:700;
        font-size:25px;color:${s.type};letter-spacing:-0.01em}
    </style></head><body>
      <div class="stage">
        <div class="word" style="left:84px;top:120px">${num("01 — THE PHOTO")}JUST</div>
        <div class="chip"><img src="${photo}"/></div>
        ${s.numerals ? "" : `<div class="cap">started as this phone pic</div>`}

        <div class="word" style="right:570px;top:400px;${s.likeExtra}">${num("02 — THE ART")}LIKE</div>
        <div class="milo"><img src="${s.dog}"/></div>

        <div class="word" style="left:84px;top:756px">${num("03 — THE KEEPSAKE")}THAT</div>
        <div class="coaster">
          <img class="scene" src="${scene}"/>
          <img class="eng" src="${burnt}"/>
          <div class="nm">Milo</div>
        </div>

        <svg class="swoosh" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none"
             stroke="${s.accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M 1130 330 C 1280 370, 1420 440, 1520 530" stroke-dasharray="2 26"/>
          <path d="M 1480 490 L 1526 536 L 1456 552" />
          <path d="M 856 642 L 888 670"/>
          <path d="M 810 696 L 852 708"/>
          <path d="M 906 604 L 920 642"/>
        </svg>

        <div class="doodle" style="top:300px;left:1160px">${sparkle(48, s.accent, 10)}</div>
        <div class="doodle" style="top:96px;left:790px">${sparkle(36, s.accent, -12)}</div>
        <div class="doodle" style="top:560px;left:700px">${sparkle(40, s.accent, 18)}</div>

        <div class="eyebrow">Magic Engraver</div>
        <div class="logo"><img src="${logo}"/></div>
        <div class="tagline">One photo in. An heirloom out.</div>
      </div>
    </body></html>`;

    const out = await renderSvg({ markup: html, width: W, height: H, outPath: `output/jlt-${s.name}.png` });
    console.log(`✓ ${out.outPath}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
