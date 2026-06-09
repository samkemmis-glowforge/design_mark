import { copyFile, mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";
import {
  W,
  H,
  STICKERS,
  buildStageHtml,
  dataUri,
  MACHINE_ASSET,
} from "./render-90s-banner.js";

/**
 * Export the '90s banner as individual layers for hand-assembly in Canva (or any
 * editor): a full-bleed backdrop plus every movable element as its own
 * transparent PNG. Drag the folder into Canva Uploads and arrange freely —
 * overlap encouraged. No Canva API/credentials needed.
 *
 * Output: output/layers/*.png  (+ a contact sheet is built separately).
 */

const DIR = "output/layers";

async function main() {
  const outDir = resolve(REPO_ROOT, DIR);
  await mkdir(outDir, { recursive: true });

  const logoUri = await dataUri("brand/logo/logo-full-250.png", "image/png");
  const machineUri = await dataUri(MACHINE_ASSET, "image/png");

  // 00 — backdrop: everything except the movable machine + stickers (opaque).
  const base = await renderSvg({
    markup: buildStageHtml({ logoUri, machineUri, stickers: false, machine: false }),
    width: W,
    height: H,
    outPath: `${DIR}/00-background.png`,
  });
  console.log(`✓ ${base.outPath} (${base.width}×${base.height})  [backdrop]`);

  // 01 — the retro machine (already a transparent PNG asset).
  await copyFile(resolve(REPO_ROOT, MACHINE_ASSET), `${outDir}/01-machine.png`);
  console.log(`✓ ${DIR}/01-machine.png  [transparent]`);

  // 02+ — each software sticker as its own tight, transparent PNG.
  let n = 2;
  for (const s of STICKERS) {
    const idx = String(n++).padStart(2, "0");
    const out = await renderSvg({
      markup: s.svg,
      width: s.w,
      height: s.h,
      omitBackground: true,
      outPath: `${DIR}/${idx}-${s.name}.png`,
    });
    console.log(`✓ ${out.outPath} (${out.width}×${out.height})  [transparent]`);
  }

  const files = (await readdir(outDir)).filter((f) => f.endsWith(".png")).sort();
  console.log(`\n${files.length} layers in ${DIR}/:`);
  for (const f of files) console.log(`  • ${f}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("✗", e);
    process.exit(1);
  },
);
