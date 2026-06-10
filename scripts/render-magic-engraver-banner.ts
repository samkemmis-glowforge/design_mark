import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * "Magic Engraver" product-page banner — 3-step strip: photo → engraving →
 * leather keepsake tag, with the "1. Just  2. Make  3. Stuff" tagline.
 *
 * STATUS: layout scaffold. Panels 1 & 2 use placeholders until Milo's real
 * photo + engraving are pulled from Drive; the panel-3 tag is code-drawn (the
 * real engraving + "Milo" composite drops into the tag face). Clean Glowforge
 * brand styling (teal/cream/ink + Inter), not the '90s treatment.
 */

const W = 1600;
const H = 600;

async function dataUri(relPath: string, mime: string): Promise<string> {
  const b64 = (await readFile(resolve(REPO_ROOT, relPath))).toString("base64");
  return `data:${mime};base64,${b64}`;
}

// Placeholder art for panels still awaiting real assets.
function placeholder(caption: string, glyph: string): string {
  return `
  <div class="ph">
    <div class="ph-glyph">${glyph}</div>
    <div class="ph-cap">${caption}</div>
    <div class="ph-note">your image here</div>
  </div>`;
}

const CAMERA = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#16A0B0" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
  <rect x="6" y="16" width="52" height="38" rx="6"/><path d="M22 16 l4-6 h12 l4 6"/><circle cx="32" cy="35" r="11"/></svg>`;

const ENGRAVE = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#16A0B0" stroke-width="3.5" stroke-linecap="round">
  <path d="M10 46 L40 16 a6 6 0 0 1 8 8 L26 46 Z"/><path d="M10 46 l-3 9 l9 -3"/><path d="M40 16 l8 8"/></svg>`;

// Classic rounded leather dog tag with a split ring, stitching, a paw-print
// engraving stand-in, and "MILO". The real dog engraving composites onto the
// tag face in the same spot.
const TAG = `
<svg width="230" height="280" viewBox="0 0 230 280" xmlns="http://www.w3.org/2000/svg">
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
  <!-- paw-print engraving stand-in (debossed look) -->
  <g transform="translate(115 132)" fill="#34180e">
    <ellipse cx="0" cy="12" rx="20" ry="16"/>
    <ellipse cx="-20" cy="-8" rx="7" ry="10"/>
    <ellipse cx="-7" cy="-17" rx="7" ry="10"/>
    <ellipse cx="7" cy="-17" rx="7" ry="10"/>
    <ellipse cx="20" cy="-8" rx="7" ry="10"/>
  </g>
  <g transform="translate(115 132)" fill="#a4674c" opacity="0.5">
    <ellipse cx="-1.5" cy="10.5" rx="20" ry="16"/></g>
  <text x="115" y="226" text-anchor="middle" font-family="Inter,sans-serif" font-weight="900" font-size="30" letter-spacing="3" fill="#2a130b">MILO</text>
  <text x="113.5" y="224.5" text-anchor="middle" font-family="Inter,sans-serif" font-weight="900" font-size="30" letter-spacing="3" fill="#b07a5e" opacity="0.5">MILO</text>
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
    .ph{display:flex;flex-direction:column;align-items:center;gap:10px;color:#7a8a8c}
    .ph-cap{font-weight:800;font-size:20px;color:var(--ink)}
    .ph-note{font-size:13px;letter-spacing:.04em;color:#9aa6a7}
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
        ${panel("1", "Just", placeholder("Dog photo", CAMERA))}
        <div class="arrow">${ARROW}</div>
        ${panel("2", "Make", placeholder("Engraving", ENGRAVE))}
        <div class="arrow">${ARROW}</div>
        ${panel("3", "Stuff", TAG)}
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
