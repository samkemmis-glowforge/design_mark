import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { coverCrop, cropCss, type ImageInfo } from "../agent/render/layout.js";
import { SOCIAL } from "../agent/render/social.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Glowforge Premium social — concept round, 1:1 (1080×1080). Three variants:
 *   A Pain     — before/after UI split (cluttered legacy vs clean Premium)
 *   B Features — Premium UI showcase, "Works with any laser" as the callout
 *   C Outcome  — lifestyle finished projects + "Made easier with Premium"
 * UIs are on-brand MOCKS (representative, not real screenshots).
 */

const S = SOCIAL["ig-square"];
const W = S.w, H = S.h;

async function dataUri(rel: string, mime: string): Promise<string> {
  return `data:${mime};base64,${(await readFile(resolve(REPO_ROOT, rel))).toString("base64")}`;
}
const rects = (n: number, cls: string) => Array.from({ length: n }, () => `<i class="${cls}"></i>`).join("");

async function main() {
  const logo = await dataUri("brand/logo/logo-full-250.png", "image/png");
  const life = await dataUri("assets/premium/lifestyle-projects.png", "image/png");
  const sLife: ImageInfo = { w: 1024, h: 1024, subject: { x: 0.1, y: 0.25, w: 0.8, h: 0.55 } };

  const head = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--tint:#C9EDF2;--dark:#0E454D;--cream:#F9E7CB;--paper:#FDF8F1;--ink:#1C1813;
      --yellow:#FFE677;--coral:#FFA399;}
    html,body{margin:0;padding:0}*{box-sizing:border-box}
    .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;overflow:hidden}
    .eyebrow{position:absolute;top:64px;left:72px;font-weight:800;font-size:21px;letter-spacing:.2em;text-transform:uppercase}
    .logo{position:absolute;top:58px;right:72px}.logo img{display:block;height:32px}
    .h1{position:absolute;font-weight:900;letter-spacing:-.03em;line-height:.98;color:var(--ink)}
    .win{position:absolute;border-radius:18px;overflow:hidden;background:#fff}
    .bar{height:34px;display:flex;align-items:center;gap:6px;padding:0 12px}
    .dot{width:11px;height:11px;border-radius:50%}
    /* legacy clutter */
    .legacy{background:#dededa}
    .legacy .bar{background:#c4c1b8;gap:8px}
    .legacy .menu{display:flex;gap:10px;margin-left:10px}
    .legacy .menu i{width:30px;height:8px;background:#9b988f;display:block;border-radius:2px}
    .legacy .tools{display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:#cfccc3}
    .legacy .tools i{width:22px;height:22px;background:#a8a59b;border-radius:3px;display:block}
    .legacy .body{display:flex;height:210px}
    .legacy .side{width:84px;background:#c9c6bd;padding:8px;display:flex;flex-direction:column;gap:5px}
    .legacy .side i{height:12px;background:#a29f95;border-radius:2px;display:block}
    .legacy .cv{flex:1;position:relative;background:#efeee9;margin:6px}
    .legacy .cv i{position:absolute;display:block;border:2px solid #8a8b5a}
    /* premium clean */
    .prem{background:#fff;box-shadow:0 12px 40px rgba(14,69,77,.12)}
    .prem .bar{background:var(--paper)}
    .prem .body{display:flex;height:248px}
    .prem .rail{width:74px;background:var(--paper);display:flex;flex-direction:column;align-items:center;gap:18px;padding-top:22px}
    .prem .rail i{width:38px;height:38px;border-radius:11px;background:var(--tint);display:block}
    .prem .rail i.on{background:var(--teal)}
    .prem .cv{flex:1;background:#fff;display:flex;align-items:center;justify-content:center;position:relative}
    .prem .shape{width:150px;height:150px;border-radius:24px;background:var(--cream);border:3px solid var(--teal)}
    .prem .pill{position:absolute;bottom:18px;font-weight:800;font-size:18px;color:#fff;background:var(--teal);padding:11px 22px;border-radius:999px}
    .lbl{position:absolute;font-weight:800;font-size:18px;letter-spacing:.04em;padding:7px 16px;border-radius:999px}
  </style></head><body>`;
  const foot = `</body></html>`;

  // ---- A: Pain (before/after split) ----
  const cvShapes = `<i style="left:14px;top:16px;width:46px;height:30px;border-color:#8a5a5a"></i>
    <i style="left:80px;top:40px;width:30px;height:44px;border-color:#8a8b5a"></i>
    <i style="left:130px;top:14px;width:40px;height:24px;border-color:#5a6a8a"></i>
    <i style="left:60px;top:96px;width:54px;height:22px;border-color:#8a5a5a"></i>
    <i style="left:150px;top:80px;width:28px;height:40px;border-color:#7a7a4a"></i>`;
  const a = `<div class="stage" style="background:var(--paper)">
    <div class="eyebrow" style="color:var(--teal)">Glowforge Premium</div>
    <div class="logo"><img src="${logo}"/></div>
    <div class="h1" style="top:150px;left:72px;font-size:78px">Less clutter.<br/>More making.</div>
    <div class="win legacy" style="left:64px;top:392px;width:466px">
      <div class="bar"><span class="dot" style="background:#8a5a5a"></span><span class="dot" style="background:#8a8b5a"></span><span class="dot" style="background:#7a7a8a"></span><div class="menu">${rects(6,"")}</div></div>
      <div class="tools">${rects(11,"")}</div>
      <div class="tools" style="background:#c7c4bb">${rects(9,"")}</div>
      <div class="body"><div class="side">${rects(7,"")}</div><div class="cv">${cvShapes}</div></div>
    </div>
    <div class="win prem" style="left:550px;top:392px;width:466px">
      <div class="bar"><span class="dot" style="background:#FFA399"></span><span class="dot" style="background:#FFE677"></span><span class="dot" style="background:#16A0B0"></span></div>
      <div class="body"><div class="rail"><i class="on"></i><i></i><i></i><i></i></div>
        <div class="cv"><div class="shape"></div><div class="pill">✨ Generate</div></div></div>
    </div>
    <div class="lbl" style="left:64px;top:352px;background:#cfccc3;color:#5d564b">the old way</div>
    <div class="lbl" style="left:550px;top:352px;background:var(--teal);color:#fff">Glowforge Premium</div>
  </div>`;

  // ---- B: Features ("Works with any laser") ----
  const b = `<div class="stage" style="background:var(--dark)">
    <div class="eyebrow" style="color:var(--tint)">Glowforge Premium</div>
    <div class="logo"><img src="${logo}" style="filter:brightness(0) invert(1)"/></div>
    <div class="h1" style="top:150px;left:72px;font-size:96px;color:var(--cream)">Works with<br/>any laser.</div>
    <div style="position:absolute;top:392px;left:72px;font-weight:700;font-size:24px;color:var(--tint)">
      AI design&nbsp;·&nbsp;Smartfit nesting&nbsp;·&nbsp;1000s of projects</div>
    <div class="win prem" style="left:72px;top:452px;width:936px;border-radius:22px">
      <div class="bar" style="height:40px"><span class="dot" style="background:#FFA399"></span><span class="dot" style="background:#FFE677"></span><span class="dot" style="background:#16A0B0"></span>
        <div style="margin-left:14px;font-weight:700;font-size:15px;color:#8a8780">✨ “a hexagon coaster set”</div></div>
      <div style="display:flex;height:498px">
        <div class="rail" style="width:88px"><i class="on"></i><i></i><i></i><i></i></div>
        <div style="flex:1;background:#fff;position:relative;padding:26px">
          <div style="font-weight:800;font-size:18px;color:var(--dark);margin-bottom:14px">Smartfit arranged 6 pieces</div>
          <!-- laser bed with nested pieces -->
          <div style="position:relative;height:300px;background:var(--paper);border:3px dashed var(--teal);border-radius:12px">
            <div style="position:absolute;left:24px;top:24px;width:120px;height:120px;background:var(--tint);border-radius:50%"></div>
            <div style="position:absolute;left:160px;top:24px;width:120px;height:120px;background:var(--cream);border:3px solid var(--teal);border-radius:50%"></div>
            <div style="position:absolute;left:296px;top:24px;width:120px;height:120px;background:var(--tint);border-radius:50%"></div>
            <div style="position:absolute;left:24px;top:160px;width:120px;height:120px;background:var(--cream);border:3px solid var(--teal);border-radius:50%"></div>
            <div style="position:absolute;left:160px;top:160px;width:120px;height:120px;background:var(--tint);border-radius:50%"></div>
            <div style="position:absolute;left:296px;top:160px;width:120px;height:120px;background:var(--cream);border:3px solid var(--teal);border-radius:50%"></div>
            <div style="position:absolute;right:18px;bottom:16px;font-weight:800;font-size:15px;color:var(--teal)">98% material used</div>
          </div>
          <div style="display:flex;gap:12px;margin-top:18px">
            <div style="flex:1;height:64px;background:var(--paper);border-radius:10px"></div>
            <div style="flex:1;height:64px;background:var(--paper);border-radius:10px"></div>
            <div style="flex:1;height:64px;background:var(--paper);border-radius:10px"></div>
            <div style="flex:1;height:64px;background:var(--paper);border-radius:10px"></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // ---- C: Outcome (lifestyle + copy) ----
  const lc = coverCrop(sLife, { w: W, h: H }, 1.0);
  const c = `<div class="stage" style="background:var(--ink)">
    <img src="${life}" style="${cropCss(lc)}"/>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(28,24,19,.55) 0%, rgba(28,24,19,0) 34%, rgba(28,24,19,0) 60%, rgba(28,24,19,.78) 100%)"></div>
    <div class="eyebrow" style="color:#fff;opacity:.95">Glowforge Premium</div>
    <div class="logo"><img src="${logo}" style="filter:brightness(0) invert(1)"/></div>
    <div class="h1" style="left:72px;bottom:188px;font-size:92px;color:#fff">Made easier<br/>with Premium.</div>
    <div style="position:absolute;left:74px;bottom:120px;font-weight:700;font-size:26px;color:var(--cream)">
      From idea to finished piece — faster.</div>
  </div>`;

  const variants: [string, string, object[]][] = [
    ["a-pain", a, [{ type: "contrast", name: "headline", region: [72, 150, 560, 170], min: 4.5 }]],
    ["b-features", b, [{ type: "contrast", name: "headline", region: [72, 150, 700, 220], min: 4.5 },
      { type: "contrast", name: "subhead", region: [72, 392, 760, 40], min: 3.0 }]],
    ["c-outcome", c, [{ type: "contrast", name: "headline", region: [72, H - 280, 620, 200], min: 4.5 }]],
  ];

  for (const [name, body, checks] of variants) {
    const out = await renderSvg({ markup: head + body + foot, width: W, height: H, outPath: `output/premium-${name}.png` });
    await writeFile(`output/premium-${name}.checks.json`, JSON.stringify({ canvas: [W, H], checks }, null, 2));
    console.log(`✓ ${out.outPath}`);
  }
  process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
