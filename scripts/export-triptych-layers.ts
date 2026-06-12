import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { type ImageInfo } from "../agent/render/layout.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Export the triptych's geometry + helper layers for hand-assembly in Canva.
 * Mirrors render-jlt-triptych.ts exactly; emits assets/hero-layers/
 * triptych-layers.json (placements) + the ring-clipped photo circle PNG.
 * scripts/build-triptych-pptx.py consumes the JSON to build the PPTX.
 */

const W = 1920, H = 1080, P = 640;

async function main() {
  const subjects = JSON.parse(
    await readFile(resolve(REPO_ROOT, "assets/magic-engraver/subjects.json"), "utf8"),
  ) as Record<string, ImageInfo>;
  const sPhoto = subjects["milo2.jpg"];
  const sScene = subjects["coaster-scene.png"];
  const sEng = subjects["milo-engrave2.png"];
  const ENG_ASPECT = sEng.h / sEng.w;

  // —— identical geometry to render-jlt-triptych.ts ——
  const CIRC = 450;
  const circCx = P / 2, circCy = 650;
  const circX = circCx - CIRC / 2, circY = circCy - CIRC / 2;
  const DOG = { cx: 0.579, cy: 0.382, h: 0.733 };
  const popScale = (1.18 * CIRC) / (DOG.h * sPhoto.h);
  const popW = sPhoto.w * popScale, popH = sPhoto.h * popScale;
  const popLeft = circCx - DOG.cx * popW;
  const popTop = circCy - DOG.cy * popH;

  const ps = 1080 / 1024;
  const sceneW = 1024 * ps;
  const sceneLeft = 1280 - 170;
  const faceCx = sceneLeft + (sScene.subject.x + sScene.subject.w / 2) * sceneW;
  const faceCy = (sScene.subject.y + sScene.subject.h / 2) * sceneW;
  const faceD = sScene.subject.w * sceneW;
  const engW = faceD * 0.70, engH = engW * ENG_ASPECT;
  const engTop = faceCy - engH / 2;
  const nameTop = faceCy + faceD * 0.16;

  // Ring-clipped photo circle as its own transparent layer (border included).
  const photo = `data:image/jpeg;base64,${(await readFile(resolve(REPO_ROOT, "assets/magic-engraver/milo2.jpg"))).toString("base64")}`;
  const PAD = 6; // border width
  await renderSvg({
    markup: `<div style="position:absolute;left:0;top:0;width:${CIRC}px;height:${CIRC}px;
        border-radius:50%;overflow:hidden;border:${PAD}px solid #1C1813;background:#fff">
      <img src="${photo}" style="position:absolute;left:${(popLeft - circX - PAD).toFixed(1)}px;top:${(popTop - circY - PAD).toFixed(1)}px;width:${popW.toFixed(1)}px;height:${popH.toFixed(1)}px"/>
    </div>`,
    width: CIRC + 2 * PAD, height: CIRC + 2 * PAD,
    outPath: "assets/hero-layers/triptych-photo-ring.png", omitBackground: true,
  });

  await writeFile(
    "assets/hero-layers/triptych-layers.json",
    JSON.stringify({
      canvas: [W, H], panel: P,
      bg: "#FDF8F1", p2: "#0E454D", ink: "#1C1813", cream: "#F9E7CB",
      // word font 250/280 = layer PNG display scale
      words: [
        { src: "layer-word-just.png", color: "ink", x: 60, y: 80, w: 720 * 250 / 280, h: 300 * 250 / 280 },
        { src: "layer-word-like.png", color: "cream", x: 690, y: 742, w: 600 * 250 / 280, h: 300 * 250 / 280 },
        { src: "layer-word-that.png", color: "cream", x: 1300, y: 60, w: 770 * 250 / 280, h: 300 * 250 / 280 },
      ],
      photoRing: { x: circX - PAD, y: circY - PAD, w: CIRC + 2 * PAD, h: CIRC + 2 * PAD },
      photoPop: { x: popLeft, y: popTop, w: popW, h: popH },
      dogTeal: { x: 670, y: 20, w: 580, h: 580 * ENG_ASPECT },
      scene: { panelX: 2 * P, sceneLeft, sceneW },
      engraving: { x: faceCx - engW / 2, y: engTop, w: engW, h: engH },
      name: { x: faceCx - 150, y: nameTop, w: 300, h: 300 * 200 / 520 },
    }, null, 2),
  );
  console.log("✓ triptych-photo-ring.png + triptych-layers.json");
  process.exit(0);
}

main().catch((e) => { console.error("✗", e); process.exit(1); });
