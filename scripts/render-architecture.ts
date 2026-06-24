import { writeFile } from "node:fs/promises";
import { renderSvg } from "../agent/tools/render-svg.js";

/**
 * Design Mark — current system architecture, rendered through Mark's own
 * brand pipeline. Layered top→bottom: consumers → access surfaces → core →
 * capabilities → engines → memory/asset pipeline.
 */

const W = 1600, H = 2040;

const card = (title: string, sub = "", cls = "") =>
  `<div class="card ${cls}"><div class="ct">${title}</div>${sub ? `<div class="cs">${sub}</div>` : ""}</div>`;

const band = (label: string, note: string, inner: string, cls = "") =>
  `<section class="band ${cls}">
     <div class="rail"><span class="rl">${label}</span>${note ? `<span class="rn">${note}</span>` : ""}</div>
     <div class="row">${inner}</div>
   </section>`;

async function main() {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;--line:#d9c39c;}
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{margin:0}
    .stage{width:${W}px;height:${H}px;background:var(--cream);font-family:'Inter',sans-serif;color:var(--ink);position:relative;overflow:hidden}
    .head{padding:48px 64px 8px}
    .kick{font-weight:800;font-size:20px;letter-spacing:.22em;text-transform:uppercase;color:var(--teal)}
    .title{font-weight:900;font-size:62px;letter-spacing:-.03em;line-height:.98;margin-top:6px}
    .sub{font-weight:600;font-size:22px;opacity:.72;margin-top:10px}
    .wrap{padding:14px 64px 56px;display:flex;flex-direction:column;gap:18px}
    .band{position:relative;border-radius:20px;padding:18px 22px 22px;background:rgba(255,255,255,.55);border:1.5px solid var(--line)}
    .rail{display:flex;align-items:baseline;gap:14px;margin-bottom:14px}
    .rl{font-weight:900;font-size:17px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
    .rn{font-weight:600;font-size:15px;opacity:.6}
    .row{display:flex;gap:14px;flex-wrap:wrap}
    .card{flex:1;min-width:150px;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:15px 16px}
    .ct{font-weight:800;font-size:21px;letter-spacing:-.01em;line-height:1.05}
    .cs{font-weight:600;font-size:14.5px;opacity:.62;margin-top:7px;line-height:1.3}
    /* zone accents */
    .consumers .card{border-color:#c9b48d}
    .surfaces .card{border-color:var(--teal);box-shadow:inset 0 3px 0 var(--teal)}
    .core{background:var(--ink);border-color:var(--ink)}
    .core .rl{color:var(--cream)}.core .rn{color:var(--cream);opacity:.55}
    .core .card{background:#2a2520;border-color:#3c352c}
    .core .ct{color:#fff}.core .cs{color:var(--cream);opacity:.7}
    .core .hero{flex:1.4;background:var(--teal);border-color:var(--teal)}
    .core .hero .ct{color:#fff;font-size:25px}.core .hero .cs{color:#eafafb;opacity:.92}
    .caps .card{background:#eafbfc;border-color:#bfe7ec}
    .caps .ct{color:#0c6f7b}
    .engines .card{background:#f1ede6;border-color:#ccc0aa}
    .engines .ct{color:#6a5b41}
    .mem .card{background:#fff5e2;border-color:#e8cf9f}
    .mem .ct{color:#9a6a12}
    .tag{display:inline-block;font-weight:800;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:999px;margin-left:8px;vertical-align:middle}
    .tag.live{background:#d8f3e3;color:#1c7a48}.tag.paused{background:#fbe3d0;color:#b15a1c}
    .arrow{height:16px;display:flex;align-items:center;justify-content:center;color:var(--teal);font-size:22px;font-weight:900;opacity:.7}
    /* the asset pipeline (inside mem band) as an explicit L→R chain */
    .pipe{display:flex;align-items:stretch;gap:0;width:100%}
    .pstep{flex:1;background:#fff;border:1.5px solid #e8cf9f;border-radius:14px;padding:15px 16px}
    .pstep .ct{color:#9a6a12;font-weight:800;font-size:20px}
    .pstep .cs{font-weight:600;font-size:14px;opacity:.62;margin-top:6px;line-height:1.3}
    .pa{display:flex;align-items:center;color:#cf9a36;font-weight:900;font-size:24px;padding:0 8px}
    .foot{position:absolute;left:64px;bottom:22px;font-weight:600;font-size:15px;opacity:.5}
    .legend{position:absolute;right:64px;bottom:22px;display:flex;gap:18px;font-weight:700;font-size:14px;opacity:.75}
    .legend span::before{content:"";display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:middle}
    .lg-req::before{background:var(--teal)} .lg-asset::before{background:#cf9a36}
  </style></head><body>
    <div class="stage">
      <div class="head">
        <div class="kick">System Architecture</div>
        <div class="title">How Design&nbsp;Mark works</div>
        <div class="sub">Who calls him · how they reach him · what he runs on · how he finds and makes assets</div>
      </div>
      <div class="wrap">

        ${band("Who asks", "people & agents that request design work", [
          card("You", "Slack · CLI · web app"),
          card("Other org agents", "in any repo, via MCP"),
          card("email-mark", "pulls finished graphics to post"),
        ].join(""), "consumers")}

        <div class="arrow">▼</div>

        ${band("Access surfaces", "how a request or asset gets in/out", [
          card("Remote MCP server", "render · generate · search · brief <span class='tag paused'>deploy paused</span>"),
          card("Raw GitHub URLs", "manifest → any agent fetches assets <span class='tag live'>live</span>"),
          card("GitHub Actions", "one-click Drive indexing <span class='tag live'>live</span>"),
          card("Canva", "editable designs (MCP)"),
        ].join(""), "surfaces")}

        <div class="arrow">▼</div>

        ${band("Design Mark — core", "the agent + brand discipline", [
          `<div class="card hero"><div class="ct">Design Mark</div><div class="cs">Claude agent: composes layouts by relationships, runs the render/QA loop, judges pairwise before showing a human</div></div>`,
          card("Brand system", "cream · teal · ink · Inter / Pacifico tokens"),
          card("Review discipline", "review-sheet + fixed rubric, flaws-first"),
        ].join(""), "core")}

        <div class="arrow">▼</div>

        ${band("Capabilities (tools)", "what Mark can do", [
          card("render_svg / template", "HTML/SVG → PNG, social presets"),
          card("generate_image", "Gemini image gen"),
          card("search_assets", "semantic asset lookup"),
          card("design_brief", "concept / copy ideation"),
          card("design-check", "deterministic QA gate"),
        ].join(""), "caps")}

        <div class="arrow">▼</div>

        ${band("Engines", "external compute Mark calls", [
          card("Gemini API", "image gen · vision tagging · embeddings"),
          card("Playwright / Chromium", "headless render to pixels"),
          card("OpenCV", "circle / center / contrast checks"),
        ].join(""), "engines")}

        <div class="arrow">▼</div>

        <section class="band mem">
          <div class="rail"><span class="rl">Memory &amp; assets</span><span class="rn">how Mark finds the right image — Drive flows left→right into searchable memory</span></div>
          <div class="pipe">
            <div class="pstep"><div class="ct">Google Drive</div><div class="cs">~28k marketing images (service account)</div></div>
            <div class="pa">→</div>
            <div class="pstep"><div class="ct">Indexer</div><div class="cs">walks folders, tags each thumbnail w/ vision</div></div>
            <div class="pa">→</div>
            <div class="pstep"><div class="ct">Reusability gate</div><div class="cs">keeps generic assets, drops dated promos / screenshots</div></div>
            <div class="pa">→</div>
            <div class="pstep"><div class="ct">Index + embeddings</div><div class="cs">index.json · embeddings.json · seen.json</div></div>
            <div class="pa">←</div>
            <div class="pstep"><div class="ct">search_assets</div><div class="cs">Mark queries it while composing</div></div>
          </div>
          <div class="row" style="margin-top:14px">
            ${card("Repo asset library", "marks · hero layers · social_ready graphics → raw URLs", "")}
          </div>
        </section>

      </div>
      <div class="foot">design_mark · current state · 2026-06</div>
      <div class="legend"><span class="lg-req">request flow ▼</span><span class="lg-asset">asset pipeline →</span></div>
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/design-mark-architecture.png" });
  await writeFile("output/design-mark-architecture.checks.json", JSON.stringify({ canvas: [W, H], check_motif: false, checks: [] }, null, 2));
  console.log(`✓ ${out.outPath}`); process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
