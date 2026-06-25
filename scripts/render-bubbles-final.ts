import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Overlay the crisp split slogan into Gemini's hand-drawn blank speech bubbles.
 * Bubble interior boxes are given as fractions of the (square) source image; the
 * text is centered inside each. Gemini draws the bubbles, we own the words.
 */

const du = async (r: string, m: string) => `data:${m};base64,${(await readFile(resolve(REPO_ROOT, r))).toString("base64")}`;

// interior box of each bubble, as [cx, cy, w, h] fractions of the image
const BOX = {
  fox: [0.205, 0.205, 0.26, 0.18] as const,
  bun: [0.605, 0.190, 0.235, 0.18] as const,
};

async function main() {
  const W = 1080, H = 1080;
  const photo = await du("assets/campaign/chars-bubbles-empty.png", "image/png");
  const tbox = (b: readonly number[], fz: number, lines: string[]) => {
    const [cx, cy, w, h] = b;
    const x = (cx - w / 2) * W, y = (cy - h / 2) * H;
    const inner = lines.map((l) => `<div style="white-space:nowrap">${l}</div>`).join("");
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w * W}px;height:${h * H}px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
      font-weight:900;font-size:${fz}px;line-height:1.0;letter-spacing:-.02em;color:var(--ink)">${inner}</div>`;
  };
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--ink:#1C1813;}
    *{box-sizing:border-box;margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden;background:#eee}
    .photo{position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;object-position:50% 50%}
    .em{color:var(--teal)}
  </style></head><body>
    <div class="stage">
      <img class="photo" src="${photo}"/>
      ${tbox(BOX.fox, 46, [`A better`, `<span class="em">design&nbsp;app</span>`])}
      ${tbox(BOX.bun, 46, [`for <span class="em">every</span>`, `<span class="em">laser</span>`])}
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/laser-bubbles-1x1.png" });
  await writeFile("output/laser-bubbles-1x1.checks.json", JSON.stringify({ canvas: [W, H], check_motif: false,
    checks: [{ type: "contrast", name: "fox", region: [Math.round(BOX.fox[0]*W)-85, Math.round(BOX.fox[1]*H)-28, 170, 56], min: 4.5 }] }, null, 2));
  console.log(`✓ ${out.outPath}`); process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
