import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { coverCrop, type ImageInfo } from "../agent/render/layout.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * JUST LIKE THAT — horizontal triptych. Three 640px panels, one word + one
 * Milo each, light → dark → photo:
 *
 *   P1 (near-white): JUST + the phone-photo circle (circle crosses gutter 1)
 *   P2 (deep teal):  LIKE + the engraving cut-out, cream lines on teal,
 *                    bottom-anchored, crossing gutter 2 into the photo
 *   P3 (full-bleed coaster scene): THAT over the wood, engraved coaster
 *                    with name, teal hand-drawn ring; THAT crops off-canvas
 *
 * Overflow is the style: JUST bleeds across gutter 1, images bridge panels,
 * THAT exits the frame. Step numerals 01/02/03 top-right per panel.
 * No CTA/logo (landing page carries both).
 */

const W = 1920;
const H = 1080;
const P = 640; // panel width

async function dataUri(absOrRel: string, mime: string): Promise<string> {
  const p = absOrRel.startsWith("/") ? absOrRel : resolve(REPO_ROOT, absOrRel);
  return `data:${mime};base64,${(await readFile(p)).toString("base64")}`;
}

async function main() {
  const photo = await dataUri("assets/magic-engraver/milo2.jpg", "image/jpeg");
  const dogTeal = await dataUri("assets/magic-engraver/m2-cut-teal.png", "image/png");
  const burnt = await dataUri("assets/magic-engraver/engrave2-burnt.png", "image/png");
  const scene = await dataUri("assets/magic-engraver/coaster-scene.png", "image/png");
  const pacifico = (
    await readFile(resolve(REPO_ROOT, "node_modules/@fontsource/pacifico/files/pacifico-latin-400-normal.woff2"))
  ).toString("base64");

  const subjects = JSON.parse(
    await readFile(resolve(REPO_ROOT, "assets/magic-engraver/subjects.json"), "utf8"),
  ) as Record<string, ImageInfo>;
  const sPhoto = subjects["milo2.jpg"];
  const sScene = subjects["coaster-scene.png"];
  const sEng = subjects["milo-engrave2.png"];
  const ENG_ASPECT = sEng.h / sEng.w;

  // P1 photo circle: face centered via coverCrop, circle centered in panel 1.
  const CIRC = 480;
  const circCrop = coverCrop(sPhoto, { w: CIRC, h: CIRC }, 0.82);
  const circX = (P - CIRC) / 2, circY = 500; // centered in P1

  // P3 scene: cover of the panel; coaster face lands where the geometry puts
  // it — we compute it and place the engraving (big, name below) there.
  const ps = 1080 / 1024; // cover height exactly
  const sceneW = 1024 * ps;
  const sceneLeft = 1280 - 170; // canvas coords; face roughly panel-center
  const faceCx = sceneLeft + (sScene.subject.x + sScene.subject.w / 2) * sceneW;
  const faceCy = (sScene.subject.y + sScene.subject.h / 2) * sceneW;
  const faceD = sScene.subject.w * sceneW;
  const engW = faceD * 0.70;            // big Milo, centered on the face
  const engH = engW * ENG_ASPECT;
  const engTop = faceCy - engH / 2;     // dog centered on the coaster
  const nameTop = faceCy + faceD * 0.16; // script name low, overlapping legs

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:'Pacifico';src:url(data:font/woff2;base64,${pacifico}) format('woff2')}
    :root{--teal:#16A0B0;--tint:#C9EDF2;--ink:#1C1813;--dark:#0E454D;--cream:#F9E7CB;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;background:#FDF8F1;
      font-family:'Inter',sans-serif;overflow:hidden}
    .p2{position:absolute;left:${P}px;top:0;width:${P}px;height:${H}px;background:var(--dark)}
    .p3{position:absolute;left:${2 * P}px;top:0;width:${P}px;height:${H}px;overflow:hidden}
    .rule{position:absolute;top:0;bottom:0;width:3px;background:var(--ink);z-index:1;opacity:0.9}

    .word{position:absolute;z-index:2;font-weight:900;font-size:250px;
      letter-spacing:-0.045em;white-space:nowrap;line-height:1}
    .num{position:absolute;z-index:5;top:56px;font-weight:700;font-size:24px;
      letter-spacing:0.12em}
    .eyebrow{position:absolute;z-index:5;top:56px;left:60px;font-weight:800;
      font-size:20px;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink)}
    .tagline{position:absolute;z-index:2;left:62px;top:368px;font-weight:600;
      font-size:24px;color:var(--ink)}

    .circ{position:absolute;z-index:3;left:${circX}px;top:${circY}px;
      width:${CIRC}px;height:${CIRC}px;border-radius:50%;overflow:hidden;
      border:6px solid var(--ink);background:#fff}
    .milo{position:absolute;z-index:3;left:670px;top:20px;width:580px}
    .milo img{display:block;width:100%;height:auto}

    .eng{position:absolute;z-index:3;mix-blend-mode:multiply;opacity:0.9}
    .nm{position:absolute;z-index:3;text-align:center;font-family:'Pacifico';
      font-size:46px;color:#2a1408;mix-blend-mode:multiply;opacity:0.92}
  </style></head><body>
    <div class="stage">
      <div class="p2"></div>
      <div class="p3">
        <img src="${scene}" style="position:absolute;left:${(sceneLeft - 2 * P).toFixed(0)}px;top:0;width:${sceneW.toFixed(0)}px"/>
        <img class="eng" src="${burnt}" style="left:${(faceCx - 2 * P - engW / 2).toFixed(0)}px;top:${engTop.toFixed(0)}px;width:${engW.toFixed(0)}px"/>
        <div class="nm" style="left:${(faceCx - 2 * P - 150).toFixed(0)}px;top:${nameTop.toFixed(0)}px;width:300px">Milo</div>
      </div>
      <div class="rule" style="left:${P - 1}px"></div>
      <div class="rule" style="left:${2 * P - 1}px"></div>

      <div class="word" style="left:60px;top:80px;color:var(--ink)">JUST</div>
      <div class="word" style="left:690px;top:742px;color:var(--cream)">LIKE</div>
      <div class="word" style="left:1300px;top:60px;color:var(--cream);
        text-shadow:0 2px 18px rgba(28,24,19,0.35)">THAT</div>

      <div class="circ"><img src="${photo}" style="position:absolute;left:${circCrop.left.toFixed(1)}px;top:${circCrop.top.toFixed(1)}px;width:${circCrop.width.toFixed(1)}px;height:${circCrop.height.toFixed(1)}px"/></div>
      <div class="milo"><img src="${dogTeal}"/></div>

      <div class="eyebrow">Magic Engraver</div>
      <div class="tagline">One photo in.<br/>An heirloom out.</div>
    </div>
  </body></html>`;

  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/jlt-triptych.png" });

  await writeFile(
    "output/jlt-triptych.checks.json",
    JSON.stringify({
      canvas: [W, H],
      checks: [
        {
          name: "p1-photo-circle",
          region: [circX - 40, circY - 40, CIRC + 80, CIRC + 80],
          radius: [CIRC * 0.42, CIRC * 0.56],
          expect_center: [circX + CIRC / 2, circY + CIRC / 2],
          tol: 8,
          check_motif: false, // photo: face centered via coverCrop, not dark-pixel bbox
        },
        {
          // Validates the detected coaster sits where the layout expects.
          // Dog is centered on the face by construction; name overlaps low,
          // so motif-bbox isn't the centering signal here (verified visually).
          // Sanity bound only: once the engraving is composited on, the
          // coaster can't be precisely circle-detected (the dog's features
          // create competing circles + the rim is a perspective ellipse).
          // Dog centering is by construction on the crosshair-verified face
          // center and confirmed in visual review. This just asserts a
          // coaster-sized circle exists roughly where expected.
          name: "p3-coaster",
          region: [2 * P, 0, P, H],
          radius: [faceD * 0.42, faceD * 0.66],
          expect_center: [faceCx, faceCy],
          tol: 70,
          check_motif: false,
        },
        // Legibility: WCAG contrast of text against its field. Big display
        // type passes at 3.0; the small tagline held to AA 4.5.
        { type: "contrast", name: "tagline", region: [60, 360, 240, 84], min: 4.5 },
        { type: "contrast", name: "like-on-teal", region: [690, 742, 470, 250], min: 3.0 },
        { type: "contrast", name: "milo-name-on-wood",
          region: [(faceCx - 150) | 0, nameTop | 0, 300, 56], min: 3.0 },
      ],
    }, null, 2),
  );
  console.log(`✓ ${out.outPath} (${out.width}×${out.height}) + checks.json`);
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
