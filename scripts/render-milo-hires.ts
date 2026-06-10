import { readFileSync } from "node:fs";
import { renderSvg } from "../agent/tools/render-svg.js";

// High-res transparent rasterization of the Milo woodcut (viewBox aspect ≈ 1.0362).
const W = 1660, H = 1602;
const svg = readFileSync("assets/magic-engraver/milo-engraved.svg", "utf8")
  .replace(/\swidth="[^"]*mm"/i, ` width="${W}"`)
  .replace(/\sheight="[^"]*mm"/i, ` height="${H}"`);
const out = await renderSvg({ markup: svg, width: W, height: H, outPath: "/tmp/milo/lines-hires.png", omitBackground: true });
console.log(`✓ ${out.outPath} (${out.width}x${out.height})`);
