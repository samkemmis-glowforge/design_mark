import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { SOCIAL, SocialFormat } from "../agent/render/social.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Premium Variant C — OUTCOME, built from a REAL indexed marketing photo.
 * Source: drive:1382dnwQJDA0OaO4LzWJ85pDjMgcA1rIh (Primer "Thanks, I made it!"),
 * cropped clean of its baked-in orange ad band → assets/premium/maker-organizer.jpg.
 * The maker + her laser-made organizer are the hero; the headline lives on the
 * blue-wall negative space up top under a soft top-down scrim. Emits 1:1 and 4:5.
 */

const du = async (r: string, m: string) => `data:${m};base64,${(await readFile(resolve(REPO_ROOT, r))).toString("base64")}`;

async function render(fmt: SocialFormat, outPath: string, pos = "52% 42%") {
  const S = SOCIAL[fmt]; const W = S.w, H = S.h;
  const logo = await du("brand/logo/logo-full-250.png", "image/png");
  const photo = await du("assets/premium/maker-organizer.jpg", "image/jpeg");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;}
    html,body{margin:0;padding:0}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden;background:#1b3a5a}
    .scene{position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;object-position:${pos}}
    .scrim{position:absolute;inset:0;background:linear-gradient(180deg, rgba(13,28,45,.72) 0%, rgba(13,28,45,.42) 22%, rgba(13,28,45,0) 44%)}
    .eyebrow{position:absolute;top:${S.safe.top - 12}px;left:${S.safe.left}px;font-weight:800;font-size:21px;letter-spacing:.2em;text-transform:uppercase;color:var(--cream)}
    .logo{position:absolute;top:${S.safe.top - 18}px;right:${S.safe.right}px}.logo img{height:30px;display:block;filter:drop-shadow(0 1px 6px rgba(0,0,0,.4))}
    .h1{position:absolute;left:${S.safe.left}px;top:${S.safe.top + 48}px;font-weight:900;font-size:88px;letter-spacing:-.03em;line-height:.95;color:#fff;text-shadow:0 2px 18px rgba(13,28,45,.45)}
    .sub{position:absolute;left:${S.safe.left + 2}px;top:${S.safe.top + 236}px;font-weight:700;font-size:25px;color:var(--cream);opacity:.95;text-shadow:0 1px 10px rgba(13,28,45,.5)}
  </style></head><body>
    <div class="stage">
      <img class="scene" src="${photo}"/>
      <div class="scrim"></div>
      <div class="eyebrow">Glowforge Premium</div>
      <div class="logo"><img src="${logo}"/></div>
      <div class="h1">Made easier<br/>with Premium.</div>
      <div class="sub">From idea to finished piece — faster.</div>
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath });
  await writeFile(outPath.replace(/\.png$/, ".checks.json"), JSON.stringify({ canvas: [W, H], check_motif: false,
    checks: [{ type: "contrast", name: "headline", region: [S.safe.left, S.safe.top + 48, 620, 200], min: 4.5 }] }, null, 2));
  console.log(`✓ ${out.outPath}`);
}

async function main() {
  await render("ig-square", "output/premium-c-real.png");
  await render("ig-portrait", "output/premium-c-real-4x5.png");
  await render("story", "output/premium-c-real-9x16.png", "66% 40%");
  await render("fb-link", "output/premium-c-real-191.png");
  process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
