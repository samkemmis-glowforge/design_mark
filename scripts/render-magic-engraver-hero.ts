import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * "Magic Engraver" product-page hero — concept: JUST LIKE THAT.
 *
 * Type-led VOLDOG-style poster where the wordmark IS the process: three giant
 * stacked words, each one sitting beside its step —
 *   JUST  · the taped phone photo
 *   LIKE  · the woodcut Milo cut-out (layered over the type)
 *   THAT  · the finished artifact: a walnut plaque (Gemini-generated base,
 *           real vector engraving composited on so the linework stays crisp)
 *
 * Restraint: cream field + warm ink. Teal only on doodles, tape, arrows, CTA.
 * The photo chip is the single full-color element; the plaque the only photo-
 * real object.
 */

const W = 1920;
const H = 1080;

async function dataUri(relPath: string, mime: string): Promise<string> {
  const b64 = (await readFile(resolve(REPO_ROOT, relPath))).toString("base64");
  return `data:${mime};base64,${b64}`;
}

const stripMM = (s: string): string =>
  s.replace(/\swidth="[^"]*mm"/i, "").replace(/\sheight="[^"]*mm"/i, "");

// Hand-drawn teal arrow (points down-left; mirror with scaleX(-1) for down-right).
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
  const plaque = await dataUri("assets/magic-engraver/plaque-walnut.png", "image/png");
  const engBurnt = stripMM(
    await readFile(resolve(REPO_ROOT, "assets/magic-engraver/milo-engraved.svg"), "utf8"),
  ).replaceAll("#000000", "#2a1408");

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;background:var(--cream);
      font-family:'Inter',sans-serif;overflow:hidden}

    /* ---- giant three-line wordmark (behind the collage) ---- */
    .wordmark{position:absolute;z-index:1;top:120px;left:84px}
    .wordmark div{font-weight:900;font-size:300px;line-height:0.87;
      letter-spacing:-0.045em;color:var(--ink);white-space:nowrap}

    /* ---- step 2: Milo cut-out, over the type ---- */
    .milo{position:absolute;z-index:3;left:820px;bottom:-14px;width:690px}
    .milo img{display:block;width:100%;height:auto;
      filter:drop-shadow(-14px 18px 0 rgba(28,24,19,0.18))}

    /* ---- top furniture ---- */
    .eyebrow{position:absolute;z-index:4;top:56px;left:84px;font-weight:800;
      font-size:21px;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink)}
    .logo{position:absolute;z-index:4;top:48px;right:84px}
    .logo img{height:40px;display:block}

    /* ---- step 1: taped snapshot ---- */
    .chip{position:absolute;z-index:5;top:110px;right:140px;width:236px;
      transform:rotate(7deg);background:#fff;padding:10px 10px 14px;
      box-shadow:-10px 14px 0 rgba(28,24,19,0.18)}
    .chip img{display:block;width:100%;height:212px;object-fit:cover;object-position:center 30%}
    .chip .cap{margin-top:9px;text-align:center;font-size:17px;font-style:italic;
      font-weight:600;color:var(--ink);letter-spacing:0.01em}
    .tape{position:absolute;width:104px;height:32px;background:rgba(22,160,176,0.55);
      transform:rotate(-42deg);top:-12px;left:-32px}
    .tape.b{left:auto;right:-32px;transform:rotate(42deg)}

    /* ---- step 3: the engraved walnut plaque ---- */
    .plaque{position:absolute;z-index:5;left:1330px;top:726px;width:500px;
      transform:rotate(-5deg);filter:drop-shadow(-12px 14px 0 rgba(28,24,19,0.22))}
    .plaque>img{display:block;width:100%;height:auto}
    .plaque .eng{position:absolute;top:17%;left:6%;height:66%;aspect-ratio:1.036;
      mix-blend-mode:multiply;opacity:0.92}
    .plaque .eng svg{width:100%;height:100%;display:block}
    .plaque .nm{position:absolute;right:6%;top:50%;transform:translateY(-50%);
      font-weight:900;font-size:56px;letter-spacing:0.05em;color:#2a1408;
      mix-blend-mode:multiply;opacity:0.88}

    .arrow{position:absolute;z-index:4}

    /* ---- doodles ---- */
    .doodle{position:absolute;z-index:4}

    /* ---- bottom copy + CTA ---- */
    .copy{position:absolute;z-index:5;left:84px;bottom:34px;display:flex;
      align-items:center;gap:30px}
    .copy .line{font-weight:800;font-size:30px;color:var(--ink);letter-spacing:-0.01em}
    .cta{display:inline-block;background:var(--teal);color:#fff;
      font-weight:800;font-size:22px;letter-spacing:0.02em;padding:15px 30px;
      border-radius:999px;box-shadow:-6px 8px 0 rgba(28,24,19,0.20)}
  </style></head><body>
    <div class="stage">
      <div class="wordmark"><div>JUST</div><div>LIKE</div><div>THAT</div></div>

      <div class="milo"><img src="${milo}" alt="Milo, engraved"/></div>

      <div class="eyebrow">Magic Engraver</div>
      <div class="logo"><img src="${logo}" alt="Glowforge"/></div>

      <div class="chip">
        <span class="tape"></span><span class="tape b"></span>
        <img src="${photo}" alt="Milo's phone photo"/>
        <div class="cap">started as this phone pic</div>
      </div>

      <div class="plaque">
        <img src="${plaque}" alt="Walnut plaque"/>
        <div class="eng">${engBurnt}</div>
        <div class="nm">MILO</div>
      </div>

      <div class="arrow" style="top:330px;right:330px">${ARROW}</div>
      <div class="arrow" style="top:580px;right:205px;transform:scaleX(-1)">${ARROW}</div>

      <div class="doodle" style="top:170px;left:950px">${sparkle(56, 8)}</div>
      <div class="doodle" style="top:480px;left:726px">${sparkle(40, -14)}</div>
      <div class="doodle" style="top:54px;left:586px">${sparkle(36, 18)}</div>

      <div class="copy">
        <span class="line">One photo in. An heirloom out.</span>
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
