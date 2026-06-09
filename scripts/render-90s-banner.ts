import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Email banner for the campaign "Is your laser software stuck in the '90s?"
 *
 * Brief: lean into a fun SNES / Lisa Frank maximalist-'90s look, inside
 * Glowforge's color/font framework (brand palette + Inter). SVG/HTML-code route
 * (crisp headline text, exact layout) — not the image-model route.
 *
 * The right side is a cult-'90s-software collage (Win95 window, floppy, CD-ROM,
 * "Under Construction", error dialog, arrow + hourglass cursors) with a small,
 * retro-treated real GF Pro tucked into the pile — so the hardware shares focus
 * with the software-nostalgia gags rather than dominating.
 *
 * Palette (brand.json): teal #16A0B0, purple #821AAB, coral #FFA399,
 * yellow #FFE677, cobalt #001195, cream #F9E7CB, ink #12151A.
 */

const W = 1200;
const H = 600;

async function dataUri(relPath: string, mime: string): Promise<string> {
  const b64 = (await readFile(resolve(REPO_ROOT, relPath))).toString("base64");
  return `data:${mime};base64,${b64}`;
}

// Memphis/Lisa-Frank confetti — kept to the left/top now that the right side
// holds the software collage.
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

  return `
  <svg class="confetti" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <path id="spk" d="M0,-16 C2.5,-5 5,-2.5 16,0 C5,2.5 2.5,5 0,16 C-2.5,5 -5,2.5 -16,0 C-5,-2.5 -2.5,-5 0,-16 Z"/>
      <path id="bolt" d="M2,-18 L-8,4 L0,4 L-3,18 L10,-4 L1,-4 L6,-18 Z"/>
      <path id="squig" d="M-26,0 q8,-14 16,0 t16,0 t16,0" fill="none" stroke-width="6" stroke-linecap="round"/>
    </defs>
    ${sparkle(70, 70, 1.1, "#FFE677")}
    ${sparkle(150, 150, 0.7, "#FFFFFF")}
    ${bolt(250, 70, 1.6, "#FFA399", 8)}
    ${ring(355, 110, 16, "#C9EDF2")}
    ${dot(470, 58, 9, "#FFE677")}
    ${sparkle(35, 300, 1.2, "#FFA399")}
    ${dot(70, 545, 9, "#FFE677")}
    ${sparkle(180, 560, 1.0, "#FFFFFF")}
    ${squig(330, 555, 1.1, "#FFA399", 4)}
    ${bolt(470, 560, 1.3, "#FFE677", 14)}
  </svg>`;
}

// ---- cult-90s-software stickers (inline SVG, white outline, on-palette) ----

const WIN95 = `
<svg width="222" height="142" viewBox="0 0 222 142" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="216" height="136" rx="6" fill="#EDEAE0" stroke="#fff" stroke-width="5"/>
  <defs><linearGradient id="tb" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#001195"/><stop offset="1" stop-color="#821AAB"/></linearGradient></defs>
  <rect x="11" y="11" width="200" height="24" rx="3" fill="url(#tb)"/>
  <text x="20" y="28" font-family="Inter,sans-serif" font-size="14" font-weight="800" fill="#fff">glowforge.exe</text>
  <rect x="152" y="15" width="16" height="16" rx="2" fill="#D7DBE8" stroke="#0E454D" stroke-width="1.5"/>
  <rect x="172" y="15" width="16" height="16" rx="2" fill="#D7DBE8" stroke="#0E454D" stroke-width="1.5"/>
  <rect x="192" y="15" width="16" height="16" rx="2" fill="#FFA399" stroke="#5F3C39" stroke-width="1.5"/>
  <path d="M195,18 l10,10 M205,18 l-10,10" stroke="#5F3C39" stroke-width="1.6"/>
  <text x="20" y="62" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="#12151A">C:\\&gt; Loading the future…</text>
  <rect x="20" y="74" width="182" height="18" fill="#fff" stroke="#0E454D" stroke-width="2"/>
  ${Array.from({ length: 6 })
    .map((_, i) => `<rect x="${24 + i * 19}" y="77" width="13" height="12" fill="#16A0B0"/>`)
    .join("")}
  <rect x="20" y="104" width="88" height="24" rx="3" fill="#FFE677" stroke="#0E454D" stroke-width="2"/>
  <text x="34" y="121" font-family="Inter,sans-serif" font-size="13" font-weight="800" fill="#12151A">Upgrade ▸</text>
</svg>`;

const FLOPPY = `
<svg width="92" height="92" viewBox="0 0 92 92" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="6" width="80" height="80" rx="7" fill="#202634" stroke="#fff" stroke-width="5"/>
  <rect x="30" y="6" width="34" height="30" fill="#5B6472"/>
  <rect x="46" y="9" width="12" height="24" rx="2" fill="#2A3140"/>
  <polygon points="74,6 86,6 86,18" fill="#0E1117"/>
  <rect x="20" y="44" width="52" height="34" rx="3" fill="#F9E7CB"/>
  <text x="26" y="59" font-family="Inter,sans-serif" font-size="10" font-weight="800" fill="#63241A">DESIGN</text>
  <text x="26" y="73" font-family="Inter,sans-serif" font-size="13" font-weight="900" fill="#821AAB">'95</text>
</svg>`;

const CDROM = `
<svg width="90" height="90" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="cd" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#16A0B0"/><stop offset=".28" stop-color="#821AAB"/>
    <stop offset=".5" stop-color="#FFA399"/><stop offset=".72" stop-color="#FFE677"/>
    <stop offset="1" stop-color="#16A0B0"/></linearGradient></defs>
  <circle cx="45" cy="45" r="42" fill="url(#cd)" stroke="#fff" stroke-width="4"/>
  <circle cx="45" cy="45" r="20" fill="#2A1147" opacity="0.22"/>
  <circle cx="45" cy="45" r="10" fill="#EDEAE0" stroke="#fff" stroke-width="3"/>
  <circle cx="45" cy="45" r="4" fill="#001195"/>
  <path d="M45 6 A39 39 0 0 1 84 42" stroke="#fff" stroke-opacity="0.6" stroke-width="3" fill="none"/>
</svg>`;

const CONSTRUCTION = `
<svg width="156" height="70" viewBox="0 0 156 70" xmlns="http://www.w3.org/2000/svg">
  <defs><pattern id="hz" patternUnits="userSpaceOnUse" width="16" height="16" patternTransform="rotate(45)">
    <rect width="16" height="16" fill="#12151A"/><rect width="8" height="16" fill="#FFE677"/></pattern></defs>
  <rect x="3" y="3" width="150" height="64" rx="6" fill="#FFE677" stroke="#fff" stroke-width="5"/>
  <rect x="9" y="9" width="138" height="11" fill="url(#hz)"/>
  <rect x="9" y="50" width="138" height="11" fill="url(#hz)"/>
  <text x="78" y="40" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="900" fill="#12151A">UNDER CONSTRUCTION</text>
</svg>`;

const ERRORBOX = `
<svg width="170" height="106" viewBox="0 0 170 106" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="164" height="100" rx="6" fill="#EDEAE0" stroke="#fff" stroke-width="5"/>
  <rect x="10" y="10" width="150" height="22" rx="3" fill="#821AAB"/>
  <text x="18" y="26" font-family="Inter,sans-serif" font-size="13" font-weight="800" fill="#fff">Error</text>
  <rect x="142" y="13" width="15" height="15" rx="2" fill="#FFA399" stroke="#5F3C39" stroke-width="1.4"/>
  <path d="M145,16 l9,9 M154,16 l-9,9" stroke="#5F3C39" stroke-width="1.5"/>
  <path d="M30,48 L48,48 L39,62 Z" fill="#FFE677" stroke="#12151A" stroke-width="2" stroke-linejoin="round"/>
  <text x="39" y="60" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="900" fill="#12151A">!</text>
  <text x="60" y="52" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#12151A">Software not</text>
  <text x="60" y="66" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#12151A">found in 2025</text>
  <rect x="60" y="76" width="50" height="20" rx="3" fill="#D7DBE8" stroke="#0E454D" stroke-width="2"/>
  <text x="85" y="90" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="800" fill="#12151A">OK</text>
</svg>`;

const ARROW = `
<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M4,2 L4,32 L11,25 L16,36 L21,34 L16,23 L25,23 Z" fill="#fff" stroke="#12151A" stroke-width="2.6" stroke-linejoin="round"/>
</svg>`;

const HOURGLASS = `
<svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="3" width="26" height="6" rx="2" fill="#fff" stroke="#12151A" stroke-width="2"/>
  <rect x="4" y="37" width="26" height="6" rx="2" fill="#fff" stroke="#12151A" stroke-width="2"/>
  <path d="M7,9 L27,9 L18,23 L27,37 L7,37 L16,23 Z" fill="#C9EDF2" stroke="#12151A" stroke-width="2" stroke-linejoin="round"/>
  <path d="M11,12 L23,12 L17,20 Z" fill="#821AAB"/>
  <path d="M17,26 L23,34 L11,34 Z" fill="#821AAB"/>
</svg>`;

const place = (inner: string, x: number, y: number, rot = 0, z = 4): string =>
  `<div class="sticker" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg);z-index:${z}">${inner}</div>`;

function software(): string {
  return [
    place(WIN95, 646, 54, -2, 4),
    place(CDROM, 1090, 58, 6, 4),
    place(FLOPPY, 992, 122, 9, 5),
    place(CONSTRUCTION, 640, 250, 3, 4),
    place(ERRORBOX, 650, 372, -3, 5),
    place(ARROW, 902, 246, 0, 6),
    place(HOURGLASS, 1116, 312, 9, 6),
  ].join("");
}

async function main() {
  const logo = await dataUri("brand/logo/logo-full-250.png", "image/png");
  // Real GF Pro render (Drive: GF-Pro_Front_Top_Down_V002) run through
  // scripts/retro-90s-filter.py --duotone sunset; checked in under assets/.
  const machine = await dataUri("assets/campaign-90s/gf-pro-90s-sunset.png", "image/png");

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
    .sunburst{
      position:absolute; inset:-30% -10% -10% -25%; z-index:0; opacity:.30;
      background:repeating-conic-gradient(from 0deg at 32% 42%,
        var(--coral) 0deg 7deg, transparent 7deg 14deg,
        var(--yellow) 14deg 21deg, transparent 21deg 28deg,
        var(--teal) 28deg 35deg, transparent 35deg 42deg);
      -webkit-mask-image:radial-gradient(60% 60% at 32% 42%, #000 0%, transparent 72%);
              mask-image:radial-gradient(60% 60% at 32% 42%, #000 0%, transparent 72%);
    }
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
    .machine{position:absolute; right:44px; top:50%; width:300px; z-index:3;
      transform:translateY(-50%) rotate(-3deg);
      filter:drop-shadow(0 14px 16px rgba(20,6,40,.45));}
    .sticker{position:absolute; filter:drop-shadow(4px 5px 0 rgba(48,9,63,.45))}
    .sticker svg{display:block}

    .logo-chip{
      position:absolute; top:30px; left:48px; z-index:5;
      background:#fff; border-radius:999px; padding:11px 20px;
      box-shadow:6px 6px 0 rgba(48,9,63,.55); display:flex; align-items:center;
    }
    .logo-chip img{height:26px; display:block}

    .content{position:absolute; z-index:5; left:48px; top:116px; width:660px}
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
      color:var(--ink); background:var(--yellow); white-space:nowrap;
      padding:0 12px; border-radius:8px; box-decoration-break:clone;
      -webkit-box-decoration-break:clone; text-shadow:none;
      box-shadow:5px 5px 0 var(--teal); display:inline-block; transform:rotate(-1.5deg);
    }
    .sub{
      margin:22px 0 0; max-width:480px; color:var(--tealTint);
      font-weight:600; font-size:19px; line-height:1.4;
    }
    .sub b{color:#fff}
    .cta{
      margin-top:24px; display:inline-block; text-decoration:none;
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
      <img class="machine" src="${machine}" alt="Glowforge Pro, '90s edition"/>
      ${software()}
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
