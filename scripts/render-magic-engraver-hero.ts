import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * "Magic Engraver" product-page hero — JUST LIKE THAT, the "big swing" layout
 * (comp B, art-directed with Sam; studies live in scripts/render-hero-comps.ts).
 *
 * Three giant words staircase down the canvas, each beside its step:
 *   JUST (left)  · the taped phone photo
 *   LIKE (right) · the woodcut Milo, hero-scale in the bottom-right corner
 *   THAT (left)  · the engraved walnut plaque, tucked against Milo's chest
 * Motion: a dashed teal swoosh from photo to engraving, comic "snap" ticks
 * where the plaque just appeared, alternating doodles along the diagonal.
 *
 * Restraint: cream field + warm ink; teal only on tape/swoosh/doodles/CTA;
 * the photo chip is the single full-color element, the plaque the only
 * photoreal object (Gemini walnut base + real vector engraving composited).
 */

const W = 1920;
const H = 1080;

async function dataUri(relPath: string, mime: string): Promise<string> {
  const b64 = (await readFile(resolve(REPO_ROOT, relPath))).toString("base64");
  return `data:${mime};base64,${b64}`;
}

const stripMM = (s: string): string =>
  s.replace(/\swidth="[^"]*mm"/i, "").replace(/\sheight="[^"]*mm"/i, "");

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
    .word{position:absolute;z-index:1;font-weight:900;font-size:280px;
      letter-spacing:-0.045em;color:var(--ink);white-space:nowrap;line-height:1}
    .eyebrow{position:absolute;z-index:6;top:56px;left:84px;font-weight:800;
      font-size:21px;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink)}
    .logo{position:absolute;z-index:6;top:48px;right:84px}
    .logo img{height:40px;display:block}
    .chip{position:absolute;z-index:5;left:846px;top:86px;width:230px;
      transform:rotate(6deg);background:#fff;padding:10px 10px 13px;
      box-shadow:-9px 12px 0 rgba(28,24,19,0.18)}
    .chip img{display:block;width:100%;height:206px;object-fit:cover;object-position:center 30%}
    .chip .cap{margin-top:8px;text-align:center;font-size:16px;font-style:italic;
      font-weight:600;color:var(--ink)}
    .tape{position:absolute;width:100px;height:30px;background:rgba(22,160,176,0.55);
      transform:rotate(-42deg);top:-11px;left:-30px}
    .tape.b{left:auto;right:-30px;transform:rotate(42deg)}
    .milo{position:absolute;z-index:3;left:1290px;bottom:-14px;width:600px}
    .milo img{display:block;width:100%;height:auto;
      filter:drop-shadow(-12px 14px 0 rgba(28,24,19,0.18))}
    .plaque{position:absolute;z-index:5;left:880px;top:744px;width:460px;
      transform:rotate(-5deg);filter:drop-shadow(-11px 12px 0 rgba(28,24,19,0.22))}
    .plaque>img{display:block;width:100%;height:auto}
    .plaque .eng{position:absolute;top:17%;left:6%;height:66%;aspect-ratio:1.036;
      mix-blend-mode:multiply;opacity:0.92}
    .plaque .eng svg{width:100%;height:100%;display:block}
    .plaque .nm{position:absolute;right:6%;top:50%;transform:translateY(-50%);
      font-weight:900;font-size:52px;letter-spacing:0.05em;color:#2a1408;
      mix-blend-mode:multiply;opacity:0.88}
    .swoosh{position:absolute;z-index:2;inset:0}
    .doodle{position:absolute;z-index:4}
    .tagline{position:absolute;z-index:6;right:84px;top:142px;font-weight:800;
      font-size:26px;color:var(--ink);letter-spacing:-0.01em}
    .cta{position:absolute;z-index:6;right:84px;top:200px;background:var(--teal);
      color:#fff;font-weight:800;font-size:22px;letter-spacing:0.02em;
      padding:15px 30px;border-radius:999px;box-shadow:-6px 8px 0 rgba(28,24,19,0.20)}
  </style></head><body>
    <div class="stage">
      <div class="word" style="left:84px;top:120px">JUST</div>
      <div class="chip">
        <span class="tape"></span><span class="tape b"></span>
        <img src="${photo}" alt="Milo's phone photo"/>
        <div class="cap">started as this phone pic</div>
      </div>

      <div class="word" style="right:570px;top:400px">LIKE</div>
      <div class="milo"><img src="${milo}" alt="Milo, engraved"/></div>

      <div class="word" style="left:84px;top:756px">THAT</div>
      <div class="plaque">
        <img src="${plaque}" alt="Walnut plaque"/>
        <div class="eng">${engBurnt}</div>
        <div class="nm">MILO</div>
      </div>

      <svg class="swoosh" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none"
           stroke="#16A0B0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 1010 360 C 1180 400, 1330 460, 1430 540" stroke-dasharray="2 26"/>
        <path d="M 1390 500 L 1436 546 L 1366 562" />
        <path d="M 852 700 L 884 728"/>
        <path d="M 806 754 L 848 766"/>
        <path d="M 902 662 L 916 700"/>
      </svg>

      <div class="doodle" style="top:284px;left:1150px">${sparkle(48, 10)}</div>
      <div class="doodle" style="top:100px;left:744px">${sparkle(36, -12)}</div>
      <div class="doodle" style="top:560px;left:700px">${sparkle(40, 18)}</div>

      <div class="eyebrow">Magic Engraver</div>
      <div class="logo"><img src="${logo}" alt="Glowforge"/></div>
      <div class="tagline">One photo in. An heirloom out.</div>
      <div class="cta">Try Magic Engraver</div>
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
