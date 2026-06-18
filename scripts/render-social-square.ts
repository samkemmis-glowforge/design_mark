import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { coverCrop, cropCss, type ImageInfo } from "../agent/render/layout.js";
import { SOCIAL } from "../agent/render/social.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Lo-fi concept batch — Magic Engraver IG/FB square (1080×1080). Three
 * directions, all pulling from the committed asset library:
 *   A demo    — before(photo) → after(engraved coaster), swoosh arrow
 *   B product — the engraved coaster hero, product-forward
 *   C brand   — type-led, cut-out Milo popping, minimal
 * Copy is placeholder; lock a direction, then we refine + add safe-zone checks.
 */

const S = SOCIAL["ig-square"];
const W = S.w, H = S.h;

async function dataUri(rel: string, mime: string): Promise<string> {
  return `data:${mime};base64,${(await readFile(resolve(REPO_ROOT, rel))).toString("base64")}`;
}

async function main() {
  const logo = await dataUri("brand/logo/logo-full-250.png", "image/png");
  const photo = await dataUri("assets/magic-engraver/milo2.jpg", "image/jpeg");
  const cutout = await dataUri("assets/magic-engraver/milo2-cutout.png", "image/png");
  const coaster = await dataUri("assets/hero-layers/milo-coaster-composite.png", "image/png");
  const arrow = await dataUri("assets/marks-gemini/arrow-swoosh-teal.png", "image/png");
  const sparkle = await dataUri("assets/marks-gemini/sparkle-teal.png", "image/png");

  const subjects = JSON.parse(
    await readFile(resolve(REPO_ROOT, "assets/magic-engraver/subjects.json"), "utf8"),
  ) as Record<string, ImageInfo>;
  const sPhoto = subjects["milo2.jpg"];
  const sScene = subjects["coaster-scene.png"];

  const head = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;--dark:#0E454D;--paper:#FDF8F1;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden}
    .eyebrow{position:absolute;font-weight:800;font-size:22px;letter-spacing:.22em;text-transform:uppercase}
    .logo{position:absolute}.logo img{display:block;height:34px}
    .h{position:absolute;font-weight:900;letter-spacing:-.03em;line-height:.98}
    .circ{position:absolute;border-radius:50%;overflow:hidden;border:6px solid var(--ink);background:#fff}
    .cap{position:absolute;font-size:20px;font-weight:600;font-style:italic;text-align:center}
  </style></head><body>`;
  const foot = `</body></html>`;

  // ---- Concept A: demo (before → after) ----
  const D = 360;
  const pc = coverCrop(sPhoto, { w: D, h: D }, 0.85);
  const cc = coverCrop(sScene, { w: D, h: D }, 0.95);
  const aPhoto = { x: 96, y: 250 }, aCoaster = { x: 624, y: 590 };
  const a = `<div class="stage" style="background:var(--cream)">
    <div class="eyebrow" style="top:64px;left:72px;color:var(--ink)">Magic Engraver</div>
    <div class="logo" style="top:58px;right:72px"><img src="${logo}"/></div>
    <div class="circ" style="left:${aPhoto.x}px;top:${aPhoto.y}px;width:${D}px;height:${D}px">
      <img src="${photo}" style="${cropCss(pc)}"/></div>
    <div class="cap" style="left:${aPhoto.x}px;top:${aPhoto.y + D + 10}px;width:${D}px;color:var(--ink)">your photo</div>
    <img src="${arrow}" style="position:absolute;left:430px;top:470px;width:230px;transform:rotate(28deg)"/>
    <div class="circ" style="left:${aCoaster.x}px;top:${aCoaster.y}px;width:${D}px;height:${D}px">
      <img src="${coaster}" style="${cropCss(cc)}"/></div>
    <div class="cap" style="left:${aCoaster.x}px;top:${aCoaster.y + D + 10}px;width:${D}px;color:var(--ink)">their keepsake</div>
    <div class="h" style="left:72px;bottom:96px;font-size:72px;color:var(--ink)">One photo in.<br/>An heirloom out.</div>
  </div>`;

  // ---- Concept B: product hero ----
  const BD = 760;
  const bc = coverCrop(sScene, { w: BD, h: BD }, 0.92);
  const b = `<div class="stage" style="background:var(--paper)">
    <div class="eyebrow" style="top:70px;left:0;width:${W}px;text-align:center;color:var(--teal)">Magic Engraver</div>
    <div class="h" style="top:120px;left:0;width:${W}px;text-align:center;font-size:84px;color:var(--ink)">Your best boy,<br/>engraved.</div>
    <div class="circ" style="left:${(W - BD) / 2}px;top:340px;width:${BD}px;height:${BD}px;border-width:10px">
      <img src="${coaster}" style="${cropCss(bc)}"/></div>
    <img src="${sparkle}" style="position:absolute;left:760px;top:300px;width:90px"/>
    <div class="logo" style="bottom:54px;left:0;width:${W}px;text-align:center"><img src="${logo}" style="margin:0 auto;height:30px"/></div>
  </div>`;

  // ---- Concept C: brand / type-led ----
  const c = `<div class="stage" style="background:var(--cream)">
    <div class="eyebrow" style="top:64px;left:72px;color:var(--ink)">Magic Engraver</div>
    <div class="logo" style="top:58px;right:72px"><img src="${logo}"/></div>
    <div class="h" style="top:150px;left:72px;font-size:300px;color:var(--ink)">GOOD<br/>BOY.</div>
    <img src="${cutout}" style="position:absolute;right:-40px;bottom:-20px;width:620px;
      filter:drop-shadow(-14px 16px 0 rgba(28,24,19,.16))"/>
    <img src="${sparkle}" style="position:absolute;left:120px;top:600px;width:120px"/>
    <img src="${sparkle}" style="position:absolute;left:300px;top:740px;width:64px"/>
    <div class="cap" style="left:72px;bottom:80px;width:520px;text-align:left;font-style:normal;
      font-weight:700;font-size:30px;color:var(--ink)">Turn their photo into a keepsake.</div>
  </div>`;

  const concepts: [string, string, object[]][] = [
    ["a-demo", a, [
      { name: "photo-circle", region: [aPhoto.x - 30, aPhoto.y - 30, D + 60, D + 60], radius: [D * 0.42, D * 0.56], expect_center: [aPhoto.x + D / 2, aPhoto.y + D / 2], tol: 10, check_motif: false },
      { name: "coaster-circle", region: [aCoaster.x - 30, aCoaster.y - 30, D + 60, D + 60], radius: [D * 0.4, D * 0.56], expect_center: [aCoaster.x + D / 2, aCoaster.y + D / 2], tol: 12 },
      { type: "contrast", name: "headline", region: [72, H - 230, 560, 170], min: 4.5 },
    ]],
    ["b-product", b, [
      { type: "contrast", name: "headline", region: [120, 120, 840, 220], min: 4.5 },
      { name: "coaster-circle", region: [(W - BD) / 2 - 20, 340 - 20, BD + 40, BD + 40], radius: [BD * 0.34, BD * 0.5], expect_center: [W / 2, 340 + BD / 2], tol: 16 },
    ]],
    ["c-brand", c, [
      { type: "contrast", name: "wordmark", region: [72, 160, 700, 560], min: 4.5 },
    ]],
  ];

  for (const [name, body, checks] of concepts) {
    const out = await renderSvg({ markup: head + body + foot, width: W, height: H, outPath: `output/social-sq-${name}.png` });
    await writeFile(`output/social-sq-${name}.checks.json`, JSON.stringify({ canvas: [W, H], checks }, null, 2));
    console.log(`✓ ${out.outPath}`);
  }
  process.exit(0);
}

main().catch((e) => { console.error("✗", e); process.exit(1); });
