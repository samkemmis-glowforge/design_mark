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

/** Seeded PRNG (mulberry32) so the wobble is reproducible across renders. */
function rng(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hand-drawn vertical divider: a wavering ink stroke with a gentle lean,
 * under a cream halo so it reads on white, teal, and wood alike. `cx` is the
 * gutter x; `lean` is the top→bottom horizontal drift; `seed` varies the waver.
 */
function roughDivider(cx: number, lean: number, seed: number): string {
  const r = rng(seed);
  const steps = 9;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const y = f * H;
    const waver = (r() - 0.5) * 11 + Math.sin(f * Math.PI * 1.7 + seed) * 4;
    pts.push([cx + lean * (f - 0.5) + waver, y]);
  }
  // smooth Catmull-Rom → cubic bezier path
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1], p1 = pts[i], p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `<svg class="rule" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none"
      stroke-linecap="round">
      <path d="${d}" stroke="#F9E7CB" stroke-width="9" opacity="0.85"/>
      <path d="${d}" stroke="#1C1813" stroke-width="3.4"/>
      <path d="${d}" stroke="#1C1813" stroke-width="1.4" transform="translate(2.5,0)" opacity="0.4"/>
    </svg>`;
}

async function main() {
  const photo = await dataUri("assets/magic-engraver/milo2.jpg", "image/jpeg");
  const dogTeal = await dataUri("/tmp/milo/m2-cut-teal.png", "image/png");
  const burnt = await dataUri("/tmp/milo/engrave2-burnt.png", "image/png");
  const scene = await dataUri("/tmp/milo/coaster-scene.png", "image/png");
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

  // P1 photo circle: face centered via coverCrop.
  const CIRC = 480;
  const circCrop = coverCrop(sPhoto, { w: CIRC, h: CIRC }, 0.82);
  const circX = 240, circY = 490; // circle left/top — crosses gutter 1

  // P3 scene: bottom-anchored cover of the panel; coaster face lands where
  // the geometry puts it — we compute it and place the motif + ring there.
  const ps = 1080 / 1024; // cover height exactly
  const sceneW = 1024 * ps;
  const sceneLeft = 1280 - 170; // canvas coords; face roughly panel-center
  const faceCx = sceneLeft + (sScene.subject.x + sScene.subject.w / 2) * sceneW;
  const faceCy = (sScene.subject.y + sScene.subject.h / 2) * sceneW;
  const faceD = sScene.subject.w * sceneW;
  const engW = faceD * 0.54;
  const engH = engW * ENG_ASPECT;
  const nameH = 60, nameGap = 6;
  const motifTop = faceCy - (engH + nameGap + nameH) / 2;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:'Pacifico';src:url(data:font/woff2;base64,${pacifico}) format('woff2')}
    :root{--teal:#16A0B0;--tint:#C9EDF2;--ink:#1C1813;--dark:#0E454D;--cream:#F9E7CB;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;background:#FDF8F1;
      font-family:'Inter',sans-serif;overflow:hidden}
    .p2{position:absolute;left:${P}px;top:0;width:${P}px;height:${H}px;background:var(--dark)}
    .p3{position:absolute;left:${2 * P}px;top:0;width:${P}px;height:${H}px;overflow:hidden}
    .rule{position:absolute;left:0;top:0;z-index:4}

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
    .milo{position:absolute;z-index:3;left:800px;bottom:-14px;width:540px}
    .milo img{display:block;width:100%;height:auto}

    .ring{position:absolute;z-index:4}
    .eng{position:absolute;z-index:3;mix-blend-mode:multiply;opacity:0.9}
    .nm{position:absolute;z-index:3;text-align:center;font-family:'Pacifico';
      font-size:54px;color:#2a1408;mix-blend-mode:multiply;opacity:0.92}
  </style></head><body>
    <div class="stage">
      <div class="p2"></div>
      <div class="p3">
        <img src="${scene}" style="position:absolute;left:${(sceneLeft - 2 * P).toFixed(0)}px;top:0;width:${sceneW.toFixed(0)}px"/>
        <img class="eng" src="${burnt}" style="left:${(faceCx - 2 * P - engW / 2).toFixed(0)}px;top:${motifTop.toFixed(0)}px;width:${engW.toFixed(0)}px"/>
        <div class="nm" style="left:${(faceCx - 2 * P - 150).toFixed(0)}px;top:${(motifTop + engH + nameGap).toFixed(0)}px;width:300px">Milo</div>
      </div>
      ${roughDivider(P, 22, 7)}
      ${roughDivider(2 * P, -18, 23)}

      <div class="word" style="left:60px;top:100px;color:var(--ink)">JUST</div>
      <div class="word" style="left:680px;top:280px;color:var(--cream)">LIKE</div>
      <div class="word" style="left:1320px;top:820px;color:var(--cream);
        text-shadow:0 2px 18px rgba(28,24,19,0.35)">THAT</div>

      <div class="circ"><img src="${photo}" style="position:absolute;left:${circCrop.left.toFixed(1)}px;top:${circCrop.top.toFixed(1)}px;width:${circCrop.width.toFixed(1)}px;height:${circCrop.height.toFixed(1)}px"/></div>
      <div class="milo"><img src="${dogTeal}"/></div>

      <svg class="ring" style="left:${(faceCx - 280).toFixed(0)}px;top:${(faceCy - 280).toFixed(0)}px" width="560" height="560"
           viewBox="0 0 560 560" fill="none" stroke="#16A0B0" stroke-width="7" stroke-linecap="round">
        <path d="M 280 26 C 420 28, 532 140, 530 280 C 528 420, 418 532, 278 530"/>
        <path d="M 246 526 C 118 504, 28 398, 26 278 C 24 158, 118 42, 240 28"/>
      </svg>

      <div class="num" style="left:556px;color:var(--teal)">01</div>
      <div class="num" style="left:1196px;color:var(--tint)">02</div>
      <div class="num" style="left:1836px;color:var(--cream)">03</div>

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
        },
        {
          // tol 8: engraving ink bbox is left-skewed by the tail.
          name: "p3-coaster-motif",
          region: [2 * P, 0, P, H],
          radius: [faceD * 0.42, faceD * 0.65],
          expect_center: [faceCx, faceCy],
          tol: 8,
        },
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
