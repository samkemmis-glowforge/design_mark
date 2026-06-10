import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * "Magic Engraver" product-page hero — concept: GOOD BOY.
 *
 * VOLDOG-style type-led poster: a giant two-line wordmark fills the canvas and
 * the woodcut Milo (cream-backed cut-out, assets/magic-engraver/milo-cutout.png)
 * is layered IN FRONT of the letters. The original phone photo appears once, as
 * a small taped snapshot with a hand-drawn arrow — the whole product story
 * ("one photo in, an heirloom out") told by the collage itself.
 *
 * Restraint: cream field + warm ink. Teal is reserved for the doodles, arrow,
 * and CTA. The photo chip is the single full-color element.
 */

const W = 1920;
const H = 1080;

async function dataUri(relPath: string, mime: string): Promise<string> {
  const b64 = (await readFile(resolve(REPO_ROOT, relPath))).toString("base64");
  return `data:${mime};base64,${b64}`;
}

// Hand-drawn teal arrow: wobbly curve from the photo chip down toward Milo.
const ARROW = `
<svg width="220" height="190" viewBox="0 0 220 190" fill="none" stroke="#16A0B0"
     stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
  <path d="M196 14 C 168 64, 132 108, 64 148 C 58 151, 50 156, 41 160"/>
  <path d="M78 142 L 38 162 L 82 174"/>
</svg>`;

// Four-point hand-drawn sparkles (slightly irregular on purpose).
const sparkle = (s: number, rot = 0) => `
<svg width="${s}" height="${s}" viewBox="0 0 60 60" fill="none" stroke="#16A0B0"
     stroke-width="6" stroke-linecap="round" style="transform:rotate(${rot}deg)">
  <path d="M30 6 C 31 18, 32 24, 33 28 C 42 30, 48 31, 54 31 C 46 34, 39 36, 33 37 C 31 45, 30 50, 29 56 C 28 48, 27 41, 26 36 C 18 34, 12 33, 6 31 C 14 29, 21 28, 27 27 C 28 20, 29 13, 30 6 Z"/>
</svg>`;

async function main() {
  const logo = await dataUri("brand/logo/logo-full-250.png", "image/png");
  const photo = await dataUri("assets/magic-engraver/milo-photo.jpg", "image/jpeg");
  const milo = await dataUri("assets/magic-engraver/milo-cutout.png", "image/png");

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;background:var(--cream);
      font-family:'Inter',sans-serif;overflow:hidden}

    /* ---- giant wordmark (behind the dog) ---- */
    .wordmark{position:absolute;inset:0;display:flex;flex-direction:column;
      align-items:center;justify-content:center;z-index:1;padding-top:6px}
    .wordmark div{font-weight:900;font-size:548px;line-height:0.80;
      letter-spacing:-0.045em;color:var(--ink);white-space:nowrap}

    /* ---- Milo cut-out, in front of the letters ---- */
    .milo{position:absolute;z-index:3;right:-24px;bottom:-14px;width:690px}
    .milo img{display:block;width:100%;height:auto;
      filter:drop-shadow(-14px 18px 0 rgba(28,24,19,0.18))}

    /* ---- top furniture ---- */
    .eyebrow{position:absolute;z-index:4;top:56px;left:84px;font-weight:800;
      font-size:21px;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink)}
    .logo{position:absolute;z-index:4;top:48px;right:84px}
    .logo img{height:40px;display:block}

    /* ---- the one photo: taped snapshot ---- */
    .chip{position:absolute;z-index:5;top:128px;right:118px;width:236px;
      transform:rotate(7deg);background:#fff;padding:10px 10px 14px;
      box-shadow:-10px 14px 0 rgba(28,24,19,0.18)}
    .chip img{display:block;width:100%;height:212px;object-fit:cover;object-position:center 30%}
    .chip .cap{margin-top:9px;text-align:center;font-size:17px;font-style:italic;
      font-weight:600;color:var(--ink);letter-spacing:0.01em}
    .tape{position:absolute;width:104px;height:32px;background:rgba(22,160,176,0.55);
      transform:rotate(-42deg);top:-12px;left:-32px}
    .tape.b{left:auto;right:-30px;transform:rotate(42deg)}
    .arrow{position:absolute;z-index:4;top:310px;right:210px}

    /* ---- doodles ---- */
    .doodle{position:absolute;z-index:4}

    /* ---- bottom-left copy + CTA ---- */
    .copy{position:absolute;z-index:5;left:84px;bottom:74px;max-width:430px}
    .copy .line{font-weight:800;font-size:34px;line-height:1.18;color:var(--ink);
      letter-spacing:-0.01em}
    .cta{display:inline-block;margin-top:26px;background:var(--teal);color:#fff;
      font-weight:800;font-size:23px;letter-spacing:0.02em;padding:17px 34px;
      border-radius:999px;box-shadow:-6px 8px 0 rgba(28,24,19,0.20)}
  </style></head><body>
    <div class="stage">
      <div class="wordmark"><div>GOOD</div><div>BOY</div></div>

      <div class="milo"><img src="${milo}" alt="Milo, engraved"/></div>

      <div class="eyebrow">Magic Engraver</div>
      <div class="logo"><img src="${logo}" alt="Glowforge"/></div>

      <div class="chip">
        <span class="tape"></span><span class="tape b"></span>
        <img src="${photo}" alt="Milo's phone photo"/>
        <div class="cap">started as this phone pic</div>
      </div>
      <div class="arrow">${ARROW}</div>

      <div class="doodle" style="top:330px;left:1380px">${sparkle(68, 8)}</div>
      <div class="doodle" style="top:250px;left:1296px">${sparkle(40, -14)}</div>
      <div class="doodle" style="top:54px;left:586px">${sparkle(36, 18)}</div>

      <div class="copy">
        <div class="line">One photo in.<br/>An heirloom out.</div>
        <span class="cta">Try Magic Engraver</span>
      </div>
    </div>
  </body></html>`;

  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/magic-engraver-hero.png" });
  console.log(`✓ ${out.outPath} (${out.width}×${out.height}, ${(out.bytes / 1024) | 0} KB)`);
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
