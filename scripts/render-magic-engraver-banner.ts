import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * "Magic Engraver" product-page banner — 3-step strip: photo → engraving →
 * leather keepsake tag, with the "1. Just  2. Make  3. Stuff" tagline.
 *
 * Uses Milo's real assets (Drive): milo-photo.jpg + milo-engraved.svg (a vector
 * woodcut). The engraving is shown as-is in panel 2 and recolored to a burnt
 * tone composited onto the tag face in panel 3. Clean Glowforge brand styling
 * (teal/cream/ink + Inter), not the '90s treatment.
 */

const W = 1600;
const H = 600;

async function dataUri(relPath: string, mime: string): Promise<string> {
  const b64 = (await readFile(resolve(REPO_ROOT, relPath))).toString("base64");
  return `data:${mime};base64,${b64}`;
}

const stripMM = (s: string): string =>
  s.replace(/\swidth="[^"]*mm"/i, "").replace(/\sheight="[^"]*mm"/i, "");

// Classic rounded leather dog tag (split ring, stitching) WITHOUT the engraving
// or name — those overlay as HTML so the real vector + crisp text sit on top.
const TAG_BASE = `
<svg width="250" height="304" viewBox="0 0 230 280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="leather" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a513c"/><stop offset="1" stop-color="#5a2f22"/></linearGradient>
    <radialGradient id="sheen" cx="0.5" cy="0.30" r="0.75">
      <stop offset="0" stop-color="#a4674c" stop-opacity="0.85"/><stop offset="1" stop-color="#a4674c" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="115" cy="28" r="18" fill="none" stroke="#C6CBD2" stroke-width="7"/>
  <circle cx="115" cy="28" r="18" fill="none" stroke="#8b9198" stroke-width="2.5"/>
  <rect x="28" y="44" width="174" height="210" rx="28" fill="url(#leather)" stroke="#37190f" stroke-width="3"/>
  <rect x="28" y="44" width="174" height="210" rx="28" fill="url(#sheen)"/>
  <circle cx="115" cy="66" r="10" fill="#2a130b"/><circle cx="115" cy="66" r="10" fill="none" stroke="#a4674c" stroke-width="1.5"/>
  <rect x="41" y="58" width="148" height="182" rx="19" fill="none" stroke="#F1DCC0" stroke-width="2.5" stroke-dasharray="7 6"/>
</svg>`;

const ARROW = `<svg width="46" height="40" viewBox="0 0 46 40" fill="none" stroke="#16A0B0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 20 H38"/><path d="M26 8 L40 20 L26 32"/></svg>`;

function panel(num: string, word: string, inner: string): string {
  return `
  <div class="card">
    <div class="imgbox">${inner}</div>
    <div class="label"><span class="badge">${num}</span><span class="word">${word}</span></div>
  </div>`;
}

async function main() {
  const logo = await dataUri("brand/logo/logo-full-250.png", "image/png");
  const photo = await dataUri("assets/magic-engraver/milo-photo.jpg", "image/jpeg");
  const engRaw = stripMM(await readFile(resolve(REPO_ROOT, "assets/magic-engraver/milo-engraved.svg"), "utf8"));
  const engBlack = engRaw; // panel 2: the woodcut as-is
  const engBurnt = engRaw.replaceAll("#000000", "#26110a"); // panel 3: burned into leather

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--tealTint:#C9EDF2;--cream:#F9E7CB;--creamTint:#FDF8F1;--ink:#12151A;--coral:#FFA399;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;background:#fff;font-family:'Inter',sans-serif;overflow:hidden}
    .topbar{position:absolute;top:34px;left:60px;right:60px;display:flex;align-items:center;justify-content:space-between}
    .topbar img{height:30px;display:block}
    .eyebrow{font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);
      background:var(--tealTint);padding:8px 16px;border-radius:999px}
    .row{position:absolute;left:60px;right:60px;top:108px;display:flex;align-items:flex-start;justify-content:space-between}
    .card{width:430px}
    .imgbox{width:430px;height:322px;border-radius:20px;overflow:hidden;background:var(--creamTint);
      border:3px solid var(--teal);display:flex;align-items:center;justify-content:center;position:relative}
    .photo img{width:100%;height:100%;object-fit:cover;object-position:center 32%;display:block}
    .engrave svg{max-width:100%;max-height:100%;display:block}
    .tag-wrap{position:relative;width:250px;height:304px}
    .tag-wrap>svg{display:block;width:250px;height:304px}
    .tag-engrave{position:absolute;top:62px;left:53px;width:144px;height:144px;overflow:hidden;opacity:.93}
    .tag-engrave svg{width:100%;height:100%;display:block;fill:#26110a}
    .tag-engrave svg path{fill:#26110a}
    .tag-name{position:absolute;top:226px;left:0;width:250px;text-align:center;
      font-weight:900;font-size:30px;letter-spacing:3px;color:#26110a;
      text-shadow:0 1px 0 rgba(214,170,140,.6)}
    .label{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:22px}
    .badge{width:42px;height:42px;border-radius:999px;background:var(--teal);color:#fff;font-weight:900;font-size:22px;
      display:flex;align-items:center;justify-content:center;box-shadow:3px 3px 0 var(--coral)}
    .word{font-weight:900;font-size:38px;color:var(--ink);letter-spacing:-.01em}
    .arrow{align-self:center;margin-top:130px}
  </style></head><body>
    <div class="stage">
      <div class="topbar">
        <span class="eyebrow">Magic Engraver</span>
        <img src="${logo}" alt="Glowforge"/>
      </div>
      <div class="row">
        ${panel("1", "Just", `<div class="photo" style="width:100%;height:100%"><img src="${photo}" alt="Milo"/></div>`)}
        <div class="arrow">${ARROW}</div>
        ${panel("2", "Make", `<div class="engrave" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box">${engBlack}</div>`)}
        <div class="arrow">${ARROW}</div>
        ${panel("3", "Stuff", `<div class="tag-wrap">${TAG_BASE}<div class="tag-engrave">${engBurnt}</div><div class="tag-name">MILO</div></div>`)}
      </div>
    </div>
  </body></html>`;

  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/magic-engraver-banner.png" });
  console.log(`✓ ${out.outPath} (${out.width}×${out.height}, ${(out.bytes / 1024) | 0} KB)`);
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
