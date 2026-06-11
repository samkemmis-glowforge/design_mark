import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Export every element of the JUST LIKE THAT hero as a transparent PNG layer
 * (unrotated, shadows baked) so Sam can rearrange them in Canva/Figma.
 * Output: output/layers/*.png. Background to recreate: cream #F9E7CB.
 */

async function dataUri(relPath: string, mime: string): Promise<string> {
  const b64 = (await readFile(resolve(REPO_ROOT, relPath))).toString("base64");
  return `data:${mime};base64,${b64}`;
}

const stripMM = (s: string): string =>
  s.replace(/\swidth="[^"]*mm"/i, "").replace(/\sheight="[^"]*mm"/i, "");

const BASE_CSS = `
  html,body{margin:0;padding:0;background:transparent}
  *{box-sizing:border-box}
  .word{font-family:'Inter',sans-serif;font-weight:900;font-size:280px;
    letter-spacing:-0.045em;color:#1C1813;white-space:nowrap;line-height:1}
`;

async function main() {
  const photo = await dataUri("assets/magic-engraver/milo-photo.jpg", "image/jpeg");
  const milo = await dataUri("assets/magic-engraver/milo-cutout.png", "image/png");
  const plaque = await dataUri("assets/magic-engraver/plaque-walnut.png", "image/png");
  const engBurnt = stripMM(
    await readFile(resolve(REPO_ROOT, "assets/magic-engraver/milo-engraved.svg"), "utf8"),
  ).replaceAll("#000000", "#2a1408");

  const layers: { name: string; w: number; h: number; body: string }[] = [
    { name: "word-just", w: 720, h: 300, body: `<div class="word">JUST</div>` },
    { name: "word-like", w: 600, h: 300, body: `<div class="word">LIKE</div>` },
    { name: "word-that", w: 770, h: 300, body: `<div class="word">THAT</div>` },
    {
      name: "photo-chip", w: 330, h: 350,
      body: `<div style="position:absolute;left:46px;top:36px;width:230px;background:#fff;
          padding:10px 10px 13px;box-shadow:-9px 12px 0 rgba(28,24,19,0.18);
          font-family:'Inter',sans-serif">
        <span style="position:absolute;width:100px;height:30px;background:rgba(22,160,176,0.55);
          transform:rotate(-42deg);top:-11px;left:-30px"></span>
        <span style="position:absolute;width:100px;height:30px;background:rgba(22,160,176,0.55);
          transform:rotate(42deg);top:-11px;right:-30px"></span>
        <img src="${photo}" style="display:block;width:100%;height:206px;object-fit:cover;object-position:center 30%"/>
        <div style="margin-top:8px;text-align:center;font-size:16px;font-style:italic;font-weight:600;color:#1C1813">started as this phone pic</div>
      </div>`,
    },
    {
      name: "milo-engraved", w: 1260, h: 1250,
      body: `<img src="${milo}" style="display:block;width:1200px;height:auto;margin:10px 0 0 36px;
        filter:drop-shadow(-24px 28px 0 rgba(28,24,19,0.18))"/>`,
    },
    {
      name: "plaque-engraved", w: 760, h: 500,
      body: `<div style="position:absolute;left:30px;top:14px;width:700px;
          filter:drop-shadow(-17px 18px 0 rgba(28,24,19,0.22));font-family:'Inter',sans-serif">
        <img src="${plaque}" style="display:block;width:100%;height:auto"/>
        <div style="position:absolute;top:17%;left:6%;height:66%;aspect-ratio:1.036;
          mix-blend-mode:multiply;opacity:0.92">${engBurnt
            .replace("<svg ", '<svg style="width:100%;height:100%;display:block" ')}</div>
        <div style="position:absolute;right:6%;top:50%;transform:translateY(-50%);
          font-weight:900;font-size:79px;letter-spacing:0.05em;color:#2a1408;
          mix-blend-mode:multiply;opacity:0.88">MILO</div>
      </div>`,
    },
    {
      name: "swoosh-arrow", w: 480, h: 260,
      body: `<svg width="480" height="260" viewBox="0 0 480 260" fill="none" stroke="#16A0B0"
          stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 30 30 C 200 70, 350 130, 450 210" stroke-dasharray="2 26"/>
        <path d="M 410 170 L 456 216 L 386 232"/></svg>`,
    },
    {
      name: "snap-ticks", w: 160, h: 150,
      body: `<svg width="160" height="150" viewBox="0 0 160 150" fill="none" stroke="#16A0B0"
          stroke-width="7" stroke-linecap="round">
        <path d="M62 50 L94 78"/><path d="M16 104 L58 116"/><path d="M112 12 L126 50"/></svg>`,
    },
    {
      name: "sparkle", w: 200, h: 200,
      body: `<svg width="200" height="200" viewBox="0 0 60 60" fill="none" stroke="#16A0B0"
          stroke-width="6" stroke-linecap="round">
        <path d="M30 6 C 31 18, 32 24, 33 28 C 42 30, 48 31, 54 31 C 46 34, 39 36, 33 37 C 31 45, 30 50, 29 56 C 28 48, 27 41, 26 36 C 18 34, 12 33, 6 31 C 14 29, 21 28, 27 27 C 28 20, 29 13, 30 6 Z"/></svg>`,
    },
    {
      name: "cta-pill", w: 330, h: 100,
      body: `<span style="position:absolute;left:14px;top:10px;display:inline-block;background:#16A0B0;
        color:#fff;font-family:'Inter',sans-serif;font-weight:800;font-size:22px;letter-spacing:0.02em;
        padding:15px 30px;border-radius:999px;box-shadow:-6px 8px 0 rgba(28,24,19,0.20)">Try Magic Engraver</span>`,
    },
    {
      name: "tagline", w: 440, h: 50,
      body: `<div style="font-family:'Inter',sans-serif;font-weight:800;font-size:26px;
        color:#1C1813;letter-spacing:-0.01em">One photo in. An heirloom out.</div>`,
    },
    {
      name: "eyebrow", w: 480, h: 40,
      body: `<div style="font-family:'Inter',sans-serif;font-weight:800;font-size:21px;
        letter-spacing:0.24em;text-transform:uppercase;color:#1C1813">Magic Engraver</div>`,
    },
  ];

  for (const l of layers) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}</style></head><body>${l.body}</body></html>`;
    const out = await renderSvg({
      markup: html, width: l.w, height: l.h,
      outPath: `output/layers/layer-${l.name}.png`, omitBackground: true,
    });
    console.log(`✓ layer-${l.name}.png (${out.width}×${out.height})`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
