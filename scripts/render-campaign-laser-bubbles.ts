import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { SOCIAL, SocialFormat } from "../agent/render/social.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Campaign — speech-bubble version. The slogan is split across the two characters:
 * fox says "A better design app", bunny says "for every laser". On the clean
 * (cup-free) characters scene. Emits all 4 ratios.
 */

const du = async (r: string, m: string) => `data:${m};base64,${(await readFile(resolve(REPO_ROOT, r))).toString("base64")}`;

async function render(fmt: SocialFormat, outPath: string) {
  const S = SOCIAL[fmt]; const W = S.w, H = S.h;
  const photo = await du("assets/campaign/chars-clean.png", "image/png");
  const story = fmt === "story";
  const fz = fmt === "fb-link" ? 33 : (fmt === "ig-square" ? 40 : 44);
  const maxW = Math.round(W * 0.40);
  const foxTop = story ? S.safe.top : Math.round(H * 0.05);
  const bunTop = story ? S.safe.top + 70 : Math.round(H * 0.05) + Math.round(H * 0.06);
  const foxLeft = Math.round(W * 0.045);
  const bunRight = Math.round(W * 0.045);

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;}
    *{box-sizing:border-box;margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden;background:#eee}
    .photo{position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;object-position:50% 50%}
    .bubble{position:absolute;background:#fff;border:4px solid var(--ink);border-radius:26px;padding:16px 22px;
      font-weight:900;font-size:${fz}px;line-height:1.0;letter-spacing:-.01em;color:var(--ink);max-width:${maxW}px;
      box-shadow:0 10px 24px rgba(28,24,19,.22)}
    .bubble .em{color:var(--teal)}
    .bubble::before{content:"";position:absolute;bottom:-26px;width:0;height:0;
      border-left:18px solid transparent;border-right:18px solid transparent;border-top:26px solid var(--ink)}
    .bubble::after{content:"";position:absolute;bottom:-18px;width:0;height:0;
      border-left:13px solid transparent;border-right:13px solid transparent;border-top:19px solid #fff}
    .fox{left:${foxLeft}px;top:${foxTop}px}
    .fox::before,.fox::after{left:64%}
    .bun{right:${bunRight}px;top:${bunTop}px}
    .bun::before,.bun::after{left:22%}
  </style></head><body>
    <div class="stage">
      <img class="photo" src="${photo}"/>
      <div class="bubble fox">A better <span class="em">design&nbsp;app</span></div>
      <div class="bubble bun">for <span class="em">every&nbsp;laser</span></div>
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath });
  await writeFile(outPath.replace(/\.png$/, ".checks.json"), JSON.stringify({ canvas: [W, H], check_motif: false,
    checks: [{ type: "contrast", name: "fox-bubble", region: [foxLeft + 8, foxTop + 8, Math.round(maxW * 0.8), fz + 24], min: 4.5 }] }, null, 2));
  console.log(`✓ ${out.outPath}`);
}

async function main() {
  await render("ig-square", "output/laser-bubbles-1x1.png");
  await render("ig-portrait", "output/laser-bubbles-4x5.png");
  await render("story", "output/laser-bubbles-9x16.png");
  await render("fb-link", "output/laser-bubbles-191.png");
  process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
