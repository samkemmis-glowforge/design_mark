import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { coverCrop, cropCss, overlayOnSubject, makeGrid, type ImageInfo } from "../agent/render/layout.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * JUST LIKE THAT — "lockup" layout. Editorial palette (near-white / ink / teal).
 *
 * Left two-thirds: a single typographic lockup — three giant lines, flush
 * left, tight pitch; each step image is a circle set INLINE in its line at
 * cap height (word↔step pairing lives inside the typesetting). Right third:
 * full-height product panel with the engraving large. No CTA/logo (landing
 * page header carries both).
 *
 * Crops are computed from recorded subject boxes (subjects.json, visually
 * verified) via coverCrop — subjects are centered by construction.
 */

const W = 1920;
const H = 1080;
const grid = makeGrid({ width: W, height: H });

async function dataUri(absOrRel: string, mime: string): Promise<string> {
  const p = absOrRel.startsWith("/") ? absOrRel : resolve(REPO_ROOT, absOrRel);
  return `data:${mime};base64,${(await readFile(p)).toString("base64")}`;
}

async function main() {
  const photo = await dataUri("assets/magic-engraver/milo2.jpg", "image/jpeg");
  const engraving = await dataUri("assets/magic-engraver/milo-engrave2.png", "image/png");
  const burnt = await dataUri("/tmp/milo/engrave2-burnt.png", "image/png");
  const scene = await dataUri("/tmp/milo/coaster-scene.png", "image/png");
  const pacifico = (
    await readFile(resolve(REPO_ROOT, "node_modules/@fontsource/pacifico/files/pacifico-latin-400-normal.woff2"))
  ).toString("base64");

  const subjects = JSON.parse(
    await readFile(resolve(REPO_ROOT, "assets/magic-engraver/subjects.json"), "utf8"),
  ) as Record<string, ImageInfo>;
  const sPhoto = subjects["milo2.jpg"];
  const sEng = subjects["milo-engrave2.png"];
  const sScene = subjects["coaster-scene.png"];
  const ENG_ASPECT = sEng.h / sEng.w;

  // Inline step circles: subject centered, face filling ~85% of the circle.
  const D = 220;
  const dotPhoto = coverCrop(sPhoto, { w: D, h: D }, 0.85);
  const dotEng = coverCrop(sEng, { w: D, h: D }, 0.85);
  const dotScene = coverCrop(sScene, { w: D, h: D }, 0.97);
  const dotBurnt = overlayOnSubject(dotScene, ENG_ASPECT, 0.58, 0);

  // Product panel: coaster face centered, ~72% of panel width. The engraved
  // dog + name are centered ON the face as one group.
  const panelW = 680;
  const panel = coverCrop(sScene, { w: panelW, h: H }, 0.72);
  const engW = panel.subjectSize.w * 0.58;
  const engH = engW * ENG_ASPECT;
  const nameH = 66, nameGap = 8;
  const motifTop = panel.subjectCenter.y - (engH + nameGap + nameH) / 2;
  const panelBurnt = {
    width: engW, height: engH,
    left: panel.subjectCenter.x - engW / 2,
    top: motifTop,
  };
  const nameTop = motifTop + engH + nameGap;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:'Pacifico';src:url(data:font/woff2;base64,${pacifico}) format('woff2')}
    :root{--teal:#16A0B0;--ink:#1C1813;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;background:#FDF8F1;
      font-family:'Inter',sans-serif;overflow:hidden}

    /* ---- the lockup ---- */
    .line{position:absolute;left:${grid.margin}px;display:flex;align-items:center;gap:46px}
    .w{font-weight:900;font-size:240px;letter-spacing:-0.045em;color:var(--ink);
      white-space:nowrap;line-height:1}
    .w.outline{color:transparent;-webkit-text-stroke:5px var(--ink)}
    .dot{width:${D}px;height:${D}px;border-radius:50%;overflow:hidden;
      border:5px solid var(--ink);position:relative;flex:none;background:#fff}

    .tagline{position:absolute;left:${grid.margin}px;top:962px;font-weight:600;
      font-size:27px;color:var(--ink);letter-spacing:-0.01em}

    /* ---- product panel ---- */
    .panel{position:absolute;right:0;top:0;width:${panelW}px;height:${H}px;overflow:hidden}
    .panel .eng{mix-blend-mode:multiply;opacity:0.9}
    .panel .nm{position:absolute;left:0;right:0;top:${nameTop.toFixed(0)}px;text-align:center;
      font-family:'Pacifico';font-size:58px;color:#2a1408;mix-blend-mode:multiply;opacity:0.92}

    .eyebrow{position:absolute;z-index:5;top:56px;left:${grid.margin}px;font-weight:800;
      font-size:21px;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink)}
    .arrow{position:absolute;z-index:4}
  </style></head><body>
    <div class="stage">
      <div class="panel">
        <img src="${scene}" style="${cropCss(panel)}"/>
        <img class="eng" src="${burnt}" style="position:absolute;left:${panelBurnt.left.toFixed(0)}px;top:${panelBurnt.top.toFixed(0)}px;width:${panelBurnt.width.toFixed(0)}px"/>
        <div class="nm">Milo</div>
      </div>

      <div class="line" style="top:150px">
        <span class="w">JUST</span>
        <span class="dot"><img src="${photo}" style="${cropCss(dotPhoto)}"/></span>
      </div>
      <div class="line" style="top:420px">
        <span class="w outline">LIKE</span>
        <span class="dot"><img src="${engraving}" style="${cropCss(dotEng)}"/></span>
      </div>
      <div class="line" style="top:690px">
        <span class="w">THAT</span>
        <span class="dot">
          <img src="${scene}" style="${cropCss(dotScene)}"/>
          <img src="${burnt}" style="position:absolute;left:${dotBurnt.left.toFixed(0)}px;top:${dotBurnt.top.toFixed(0)}px;width:${dotBurnt.width.toFixed(0)}px;mix-blend-mode:multiply;opacity:0.9"/>
        </span>
      </div>

      <svg class="arrow" style="left:1056px;top:806px" width="240" height="120" viewBox="0 0 240 120"
           fill="none" stroke="#16A0B0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 14 96 C 80 96, 150 70, 212 28" stroke-dasharray="2 24"/>
        <path d="M 158 22 L 220 22 L 206 80"/>
      </svg>

      <div class="tagline">One photo in. An heirloom out.</div>
      <div class="eyebrow">Magic Engraver</div>
    </div>
  </body></html>`;

  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/jlt-lockup.png" });

  // Emit layout beliefs for scripts/design-check.py to verify against pixels.
  const { writeFile } = await import("node:fs/promises");
  const dot3x = 84 + 635 + 46; // THAT width + flex gap (measured)
  const faceR = panel.subjectSize.w / 2;
  await writeFile(
    "output/jlt-lockup.checks.json",
    JSON.stringify({
      canvas: [W, H],
      checks: [
        {
          name: "panel-coaster-motif",
          region: [W - panelW, 0, panelW, H],
          radius: [faceR * 0.8, faceR * 1.25],
          expect_center: [W - panelW + panel.subjectCenter.x, panel.subjectCenter.y],
          tol: 8,
        },
        {
          // tol 8: the engraving's ink bbox is left-skewed by the tail, so
          // allow ~12px bbox drift at this size (visually verified centered).
          name: "dot3-coaster-motif",
          region: [dot3x - 10, 690, D + 20, D + 20],
          radius: [D * 0.42, D * 0.56],
          expect_center: [dot3x + D / 2, 700 + D / 2],
          tol: 8,
        },
      ],
    }, null, 2),
  );
  console.log(`✓ ${out.outPath} (${out.width}×${out.height}, ${(out.bytes / 1024) | 0} KB) + checks.json`);
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
