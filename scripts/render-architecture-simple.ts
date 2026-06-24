import { writeFile } from "node:fs/promises";
import { renderSvg } from "../agent/tools/render-svg.js";

/** Design Mark — glanceable architecture: hub + labeled arrows. */

const W = 1680, H = 1060;

// node: x,y = top-left; w,h
type N = { x: number; y: number; w: number; h: number };
const C = (n: N) => ({ cx: n.x + n.w / 2, cy: n.y + n.h / 2,
  t: n.y, b: n.y + n.h, l: n.x, r: n.x + n.w });

const nodes = {
  you:   { x: 35,   y: 462, w: 235, h: 116 },
  mark:  { x: 488,  y: 440, w: 330, h: 160 },
  gem:   { x: 360,  y: 150, w: 250, h: 110 },
  rend:  { x: 700,  y: 150, w: 250, h: 110 },
  mem:   { x: 500,  y: 788, w: 300, h: 128 },
  drive: { x: 70,   y: 788, w: 300, h: 128 },
  lib:   { x: 1000, y: 458, w: 250, h: 124 },
  out:   { x: 1380, y: 458, w: 252, h: 124 },
} satisfies Record<string, N>;

// arrow: from→to points, color key, double-headed?
function arrow(x1: number, y1: number, x2: number, y2: number, c: "flow" | "eng" | "asset", dbl = false) {
  const m = `url(#a-${c})`, ms = dbl ? `url(#s-${c})` : "";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="ln ${c}" marker-end="${m}" ${dbl ? `marker-start="${ms}"` : ""}/>`;
}

async function main() {
  const n = Object.fromEntries(Object.entries(nodes).map(([k, v]) => [k, C(v)])) as Record<keyof typeof nodes, ReturnType<typeof C>>;

  const arrows = [
    arrow(n.you.r, n.you.cy, n.mark.l, n.mark.cy, "flow", true),            // asks / delivers
    arrow(n.mark.cx - 70, n.mark.t, n.gem.cx + 20, n.gem.b, "eng", true),   // Mark ⇄ Gemini
    arrow(n.mark.cx + 70, n.mark.t, n.rend.cx - 20, n.rend.b, "eng", true), // Mark ⇄ Render+QA
    arrow(n.mark.r, n.mark.cy, n.lib.l, n.lib.cy, "flow"),                  // publish
    arrow(n.lib.r, n.lib.cy, n.out.l, n.out.cy, "flow"),                    // fetch by URL
    arrow(n.mem.cx, n.mem.t, n.mark.cx, n.mark.b, "asset"),                 // search ↑
    arrow(n.drive.r, n.drive.cy, n.mem.l, n.mem.cy, "asset"),               // index →
  ].join("");

  const lbl = (x: number, y: number, t: string, c = "flow") =>
    `<div class="lbl ${c}" style="left:${x}px;top:${y}px">${t}</div>`;
  const labels = [
    lbl((n.you.r + n.mark.l) / 2, n.you.cy - 30, "asks / delivers"),
    lbl((n.mark.cx - 70 + n.gem.cx + 20) / 2 - 40, 352, "generate · tag · embed", "eng"),
    lbl((n.mark.cx + 70 + n.rend.cx - 20) / 2 + 40, 352, "render · check", "eng"),
    lbl((n.mark.r + n.lib.l) / 2, n.mark.cy - 28, "publishes"),
    lbl((n.lib.r + n.out.l) / 2, n.lib.cy - 28, "fetch by URL"),
    lbl(n.mark.cx + 60, (n.mem.t + n.mark.b) / 2, "search", "asset"),
    lbl((n.drive.r + n.mem.l) / 2, n.drive.cy - 28, "index", "asset"),
  ].join("");

  const box = (k: keyof typeof nodes, cls: string, title: string, sub: string) => {
    const v = nodes[k];
    return `<div class="node ${cls}" style="left:${v.x}px;top:${v.y}px;width:${v.w}px;height:${v.h}px">
      <div class="nt">${title}</div><div class="ns">${sub}</div></div>`;
  };

  const mk = (c: string) =>
    `<marker id="a-${c}" markerWidth="11" markerHeight="11" refX="8.5" refY="3.2" orient="auto"><path d="M0,0 L8.5,3.2 L0,6.4 Z" class="mk ${c}"/></marker>
     <marker id="s-${c}" markerWidth="11" markerHeight="11" refX="2.5" refY="3.2" orient="auto"><path d="M8.5,0 L0,3.2 L8.5,6.4 Z" class="mk ${c}"/></marker>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;--amber:#cf9a36;--gray:#8a7e6b;}
    *{box-sizing:border-box;margin:0;padding:0}
    .stage{width:${W}px;height:${H}px;background:var(--cream);font-family:'Inter',sans-serif;color:var(--ink);position:relative;overflow:hidden}
    .head{position:absolute;left:60px;top:42px}
    .kick{font-weight:800;font-size:19px;letter-spacing:.22em;text-transform:uppercase;color:var(--teal)}
    .title{font-weight:900;font-size:54px;letter-spacing:-.03em;margin-top:6px}
    svg{position:absolute;inset:0;width:${W}px;height:${H}px;z-index:0}
    .ln{stroke-width:3.5;fill:none}
    .ln.flow{stroke:var(--teal)} .ln.eng{stroke:var(--gray)} .ln.asset{stroke:var(--amber)}
    .mk.flow{fill:var(--teal)} .mk.eng{fill:var(--gray)} .mk.asset{fill:var(--amber)}
    .node{position:absolute;z-index:1;background:#fff;border:2px solid var(--line,#d9c39c);border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 4px 14px rgba(28,24,19,.06)}
    .nt{font-weight:900;font-size:25px;letter-spacing:-.02em;line-height:1.02}
    .ns{font-weight:600;font-size:15px;opacity:.6;margin-top:7px;line-height:1.28}
    .hub{background:var(--teal);border-color:var(--teal);box-shadow:0 8px 26px rgba(22,160,176,.32)}
    .hub .nt{color:#fff;font-size:34px} .hub .ns{color:#eafafb;opacity:.95;font-size:16px}
    .eng{border-color:var(--gray)} .eng .nt{color:#5f5644;font-size:23px}
    .asset{border-color:var(--amber)} .asset .nt{color:#9a6a12;font-size:23px}
    .src{border-color:var(--amber);background:#fff7e8} .src .nt{color:#9a6a12;font-size:22px}
    .actor{border-color:#c9b48d} .actor .nt{font-size:22px}
    .lbl{position:absolute;z-index:2;transform:translate(-50%,-50%);font-weight:800;font-size:14px;letter-spacing:.02em;
         background:var(--cream);padding:3px 9px;border-radius:999px;white-space:nowrap}
    .lbl.flow{color:var(--teal)} .lbl.eng{color:#5f5644} .lbl.asset{color:#9a6a12}
    .legend{position:absolute;right:60px;top:54px;display:flex;flex-direction:column;gap:7px;font-weight:700;font-size:14px}
    .legend div::before{content:"";display:inline-block;width:22px;height:4px;border-radius:2px;margin-right:9px;vertical-align:middle}
    .lg1::before{background:var(--teal)} .lg2::before{background:var(--gray)} .lg3::before{background:var(--amber)}
    .foot{position:absolute;left:60px;bottom:26px;font-weight:600;font-size:15px;opacity:.5}
  </style></head><body>
    <div class="stage">
      <div class="head"><div class="kick">System at a glance</div><div class="title">Design Mark</div></div>
      <div class="legend">
        <div class="lg1">request &amp; output flow</div>
        <div class="lg2">engine calls</div>
        <div class="lg3">asset pipeline</div>
      </div>
      <svg viewBox="0 0 ${W} ${H}"><defs>${mk("flow")}${mk("eng")}${mk("asset")}</defs>${arrows}</svg>
      ${labels}
      ${box("you",   "actor", "You &amp; agents",   "request design work")}
      ${box("gem",   "eng",   "Gemini",            "image gen · vision tags · embeddings")}
      ${box("rend",  "eng",   "Render + QA",       "Playwright → PNG · design-check")}
      ${box("mark",  "hub",   "Design Mark",       "composes, renders, self-reviews on brand")}
      ${box("drive", "src",   "Drive → gate",      "28k images, kept if reusable")}
      ${box("mem",   "asset", "Asset memory",      "searchable index + embeddings")}
      ${box("lib",   "asset", "Asset library",     "finished graphics · raw GitHub URLs")}
      ${box("out",   "actor", "email-mark · Canva", "fetch &amp; post / edit")}
      <div class="foot">design_mark · current state · 2026-06</div>
    </div>
  </body></html>`;
  const out = await renderSvg({ markup: html, width: W, height: H, outPath: "output/design-mark-architecture-simple.png" });
  await writeFile("output/design-mark-architecture-simple.checks.json", JSON.stringify({ canvas: [W, H], check_motif: false, checks: [] }, null, 2));
  console.log(`✓ ${out.outPath}`); process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
