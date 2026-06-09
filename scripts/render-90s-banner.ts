import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * One-off creative iteration: an email banner for the campaign
 *   "Is your laser software stuck in the '90s?"
 *
 * Brief: lean hard into a fun SNES / Lisa Frank maximalist-'90s look, while
 * staying inside Glowforge's color/font framework (brand palette + Inter).
 * This is the SVG/HTML-code route (crisp headline text, exact layout) — not the
 * image-model route — so every pixel is deterministic and on-palette.
 *
 * Palette (from brand.json): teal #16A0B0, purple #821AAB, coral #FFA399,
 * yellow #FFE677, cobalt #001195, cream #F9E7CB, ink #12151A.
 */

const W = 1200;
const H = 600;

async function dataUri(relPath: string, mime: string): Promise<string> {
  const b64 = (await readFile(resolve(REPO_ROOT, relPath))).toString("base64");
  return `data:${mime};base64,${b64}`;
}

// A scattered Memphis/Lisa-Frank confetti layer: sparkles, bolts, dots, rings,
// squiggles — hand-placed to frame the art and dodge the headline block.
function confetti(): string {
  const sparkle = (x: number, y: number, s: number, fill: string) =>
    `<use href="#spk" transform="translate(${x} ${y}) scale(${s})" fill="${fill}"/>`;
  const dot = (x: number, y: number, r: number, fill: string) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  const ring = (x: number, y: number, r: number, stroke: string) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${stroke}" stroke-width="5"/>`;
  const bolt = (x: number, y: number, s: number, fill: string, rot = 0) =>
    `<use href="#bolt" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}"/>`;
  const squig = (x: number, y: number, s: number, stroke: string, rot = 0) =>
    `<use href="#squig" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" stroke="${stroke}"/>`;
  const tri = (x: number, y: number, s: number, fill: string, rot = 0) =>
    `<use href="#tri" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}"/>`;

  return `
  <svg class="confetti" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <path id="spk" d="M0,-16 C2.5,-5 5,-2.5 16,0 C5,2.5 2.5,5 0,16 C-2.5,5 -5,2.5 -16,0 C-5,-2.5 -2.5,-5 0,-16 Z"/>
      <path id="bolt" d="M2,-18 L-8,4 L0,4 L-3,18 L10,-4 L1,-4 L6,-18 Z"/>
      <path id="squig" d="M-26,0 q8,-14 16,0 t16,0 t16,0" fill="none" stroke-width="6" stroke-linecap="round"/>
      <polygon id="tri" points="0,-14 13,11 -13,11"/>
    </defs>
    <!-- top band -->
    ${sparkle(70, 70, 1.1, "#FFE677")}
    ${sparkle(150, 150, 0.7, "#FFFFFF")}
    ${bolt(250, 70, 1.6, "#FFA399", 8)}
    ${ring(355, 120, 16, "#C9EDF2")}
    ${dot(470, 60, 9, "#FFE677")}
    ${tri(560, 95, 1.2, "#FFA399", 18)}
    ${sparkle(675, 55, 1.3, "#FFFFFF")}
    ${squig(820, 70, 1.2, "#16A0B0", -6)}
    ${dot(960, 60, 7, "#FFA399")}
    ${ring(1060, 95, 20, "#FFE677")}
    ${sparkle(1140, 60, 1.0, "#FFFFFF")}
    <!-- right column (around the floppy) -->
    ${bolt(1150, 200, 2.0, "#FFE677", -10)}
    ${sparkle(1015, 175, 1.4, "#FFFFFF")}
    ${dot(1120, 300, 8, "#FFA399")}
    ${squig(1080, 470, 1.3, "#C9EDF2", 10)}
    ${sparkle(1165, 430, 1.2, "#FFE677")}
    ${tri(980, 520, 1.3, "#16A0B0", -12)}
    ${ring(1175, 330, 14, "#FFFFFF")}
    <!-- bottom-left, below the text -->
    ${dot(70, 545, 9, "#FFE677")}
    ${sparkle(180, 560, 1.0, "#FFFFFF")}
    ${squig(330, 555, 1.1, "#FFA399", 4)}
    ${bolt(470, 560, 1.3, "#FFE677", 14)}
    ${sparkle(35, 300, 1.2, "#FFA399")}
  </svg>`;
}

// The 90s "villain": a tilted floppy disk, struck through. Drawn in SVG so it
// stays crisp and on-palette.
function floppy(): string {
  return `
  <div class="floppy">
    <svg viewBox="0 0 240 240" width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <!-- starburst halo -->
      <g opacity="0.9">
        ${Array.from({ length: 16 })
          .map((_, i) => {
            const a = (i * 360) / 16;
            return `<rect x="118" y="6" width="4" height="34" rx="2" fill="${
              i % 2 ? "#FFE677" : "#FFA399"
            }" transform="rotate(${a} 120 120)"/>`;
          })
          .join("")}
      </g>
      <!-- disk body -->
      <g transform="rotate(-8 120 120)">
        <rect x="58" y="58" width="124" height="124" rx="10" fill="#202634" stroke="#16A0B0" stroke-width="4"/>
        <!-- metal shutter -->
        <rect x="92" y="58" width="56" height="46" fill="#5B6472"/>
        <rect x="120" y="62" width="22" height="38" rx="2" fill="#2A3140"/>
        <!-- cut corner -->
        <polygon points="170,58 182,58 182,70" fill="#0E1117"/>
        <!-- label -->
        <rect x="74" y="116" width="92" height="56" rx="4" fill="#F9E7CB"/>
        <rect x="82" y="126" width="76" height="7" rx="3.5" fill="#FFA399"/>
        <rect x="82" y="140" width="64" height="6" rx="3" fill="#16A0B0"/>
        <rect x="82" y="152" width="70" height="6" rx="3" fill="#821AAB"/>
      </g>
      <!-- no / circle-slash -->
      <circle cx="120" cy="120" r="98" fill="none" stroke="#FF3B6B" stroke-width="12" opacity="0.92"/>
      <line x1="52" y1="52" x2="188" y2="188" stroke="#FF3B6B" stroke-width="12" stroke-linecap="round" opacity="0.92"/>
    </svg>
  </div>`;
}

async function main() {
  const logo = await dataUri("brand/logo/logo-full-250.png", "image/png");

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{
      --teal:#16A0B0; --tealTint:#C9EDF2; --purple:#821AAB; --coral:#FFA399;
      --yellow:#FFE677; --cobalt:#001195; --cream:#F9E7CB; --ink:#12151A;
    }
    html,body{margin:0;padding:0}
    .stage{
      position:relative; width:${W}px; height:${H}px; overflow:hidden;
      font-family:'Inter',sans-serif; isolation:isolate;
      background:linear-gradient(135deg,#9B1FC9 0%, var(--purple) 38%, #2410A8 78%, var(--cobalt) 100%);
    }
    /* radiating sunburst behind the headline */
    .sunburst{
      position:absolute; inset:-30% -10% -10% -25%; z-index:0; opacity:.30;
      background:repeating-conic-gradient(from 0deg at 32% 42%,
        var(--coral) 0deg 7deg, transparent 7deg 14deg,
        var(--yellow) 14deg 21deg, transparent 21deg 28deg,
        var(--teal) 28deg 35deg, transparent 35deg 42deg);
      -webkit-mask-image:radial-gradient(60% 60% at 32% 42%, #000 0%, transparent 72%);
              mask-image:radial-gradient(60% 60% at 32% 42%, #000 0%, transparent 72%);
    }
    /* synthwave perspective grid on the lower third */
    .grid{
      position:absolute; left:-20%; right:-20%; bottom:-40px; height:46%; z-index:0;
      background-image:
        repeating-linear-gradient(to right, rgba(201,237,242,.55) 0 2px, transparent 2px 64px),
        repeating-linear-gradient(to bottom, rgba(201,237,242,.55) 0 2px, transparent 2px 52px);
      transform:perspective(420px) rotateX(62deg); transform-origin:bottom center;
      -webkit-mask-image:linear-gradient(to bottom, transparent, #000 60%);
              mask-image:linear-gradient(to bottom, transparent, #000 60%);
    }
    .horizon{
      position:absolute; left:0; right:0; bottom:33%; height:120px; z-index:0;
      background:radial-gradient(60% 100% at 30% 100%, rgba(255,163,153,.55), transparent 70%);
      filter:blur(2px);
    }
    .confetti{position:absolute; inset:0; z-index:2; pointer-events:none}
    .floppy{position:absolute; right:34px; top:50%; transform:translateY(-50%); z-index:2;
      filter:drop-shadow(0 14px 0 rgba(48,9,63,.45));}

    .logo-chip{
      position:absolute; top:30px; left:48px; z-index:3;
      background:#fff; border-radius:999px; padding:11px 20px;
      box-shadow:6px 6px 0 rgba(48,9,63,.55); display:flex; align-items:center;
    }
    .logo-chip img{height:26px; display:block}

    .content{position:absolute; z-index:3; left:48px; top:120px; width:660px}
    .eyebrow{
      display:inline-block; font-weight:800; font-size:15px; letter-spacing:.16em;
      color:var(--ink); background:var(--yellow); padding:7px 14px; border-radius:999px;
      box-shadow:4px 4px 0 var(--coral); text-transform:uppercase; transform:rotate(-2deg);
    }
    .headline{
      margin:20px 0 0; color:#fff; font-weight:900; font-size:68px; line-height:.98;
      letter-spacing:-.015em;
      text-shadow:4px 4px 0 var(--coral), 8px 8px 0 var(--purple), 0 0 1px #fff;
    }
    .headline .hl{
      color:var(--ink); background:var(--yellow);
      padding:0 12px; border-radius:8px; box-decoration-break:clone;
      -webkit-box-decoration-break:clone; text-shadow:none;
      box-shadow:5px 5px 0 var(--teal); display:inline-block; transform:rotate(-1.5deg);
    }
    .sub{
      margin:26px 0 0; max-width:560px; color:var(--tealTint);
      font-weight:600; font-size:20px; line-height:1.4;
    }
    .sub b{color:#fff}
    .cta{
      margin-top:30px; display:inline-block; text-decoration:none;
      font-weight:800; font-size:20px; color:var(--ink);
      background:linear-gradient(180deg,var(--yellow),var(--coral));
      padding:16px 30px; border-radius:999px; border:3px solid #fff;
      box-shadow:6px 6px 0 var(--purple);
    }
  </style></head><body>
    <div class="stage">
      <div class="sunburst"></div>
      <div class="horizon"></div>
      <div class="grid"></div>
      ${confetti()}
      ${floppy()}
      <div class="logo-chip"><img src="${logo}" alt="Glowforge"/></div>
      <div class="content">
        <div class="eyebrow">◆ System upgrade available ◆</div>
        <h1 class="headline">Is your laser software<br><span class="hl">stuck in the '90s?</span></h1>
        <p class="sub"><b>Glowforge lives in the future.</b> Type an idea, get an AI-made design, and print it in one click — no floppy disks required.</p>
        <a class="cta">Leave the '90s behind →</a>
      </div>
    </div>
  </body></html>`;

  const out = await renderSvg({
    markup: html,
    width: W,
    height: H,
    outPath: "output/email-banner-90s.png",
  });
  console.log(`✓ ${out.outPath} (${out.width}×${out.height}, ${(out.bytes / 1024) | 0} KB)`);
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
