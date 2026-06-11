import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSvg } from "../agent/tools/render-svg.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Layout studies for the JUST / LIKE / THAT hero — two takes on the zigzag
 * (word left, word right, word left) with word↔step pairing and motion:
 *
 *   A "cascade"  — three even beats; each word sits beside its image at
 *                  similar scale; one continuous dashed swoosh stitches
 *                  photo → engraving → plaque; rows alternate a slight tilt.
 *   B "big swing"— Milo stays huge and bottom-anchored; the words zigzag
 *                  around him (LIKE tucks behind his ear); plaque overlaps
 *                  his chest. Motion from two swooping arrows + scale rhythm.
 */

const W = 1920;
const H = 1080;

async function dataUri(relPath: string, mime: string): Promise<string> {
  const b64 = (await readFile(resolve(REPO_ROOT, relPath))).toString("base64");
  return `data:${mime};base64,${b64}`;
}

const stripMM = (s: string): string =>
  s.replace(/\swidth="[^"]*mm"/i, "").replace(/\sheight="[^"]*mm"/i, "");

const sparkle = (s: number, rot = 0) => `
<svg width="${s}" height="${s}" viewBox="0 0 60 60" fill="none" stroke="#16A0B0"
     stroke-width="6" stroke-linecap="round" style="transform:rotate(${rot}deg)">
  <path d="M30 6 C 31 18, 32 24, 33 28 C 42 30, 48 31, 54 31 C 46 34, 39 36, 33 37 C 31 45, 30 50, 29 56 C 28 48, 27 41, 26 36 C 18 34, 12 33, 6 31 C 14 29, 21 28, 27 27 C 28 20, 29 13, 30 6 Z"/>
</svg>`;

const SHARED_CSS = `
  :root{--teal:#16A0B0;--cream:#F9E7CB;--ink:#1C1813;}
  html,body{margin:0;padding:0}
  .stage{position:relative;width:${W}px;height:${H}px;background:var(--cream);
    font-family:'Inter',sans-serif;overflow:hidden}
  .word{position:absolute;z-index:1;font-weight:900;letter-spacing:-0.045em;
    color:var(--ink);white-space:nowrap;line-height:1}
  .eyebrow{position:absolute;z-index:6;top:56px;left:84px;font-weight:800;
    font-size:21px;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink)}
  .logo{position:absolute;z-index:6;top:48px;right:84px}
  .logo img{height:40px;display:block}
  .chip{position:absolute;z-index:5;width:230px;background:#fff;
    padding:10px 10px 13px;box-shadow:-9px 12px 0 rgba(28,24,19,0.18)}
  .chip img{display:block;width:100%;height:206px;object-fit:cover;object-position:center 30%}
  .chip .cap{margin-top:8px;text-align:center;font-size:16px;font-style:italic;
    font-weight:600;color:var(--ink)}
  .tape{position:absolute;width:100px;height:30px;background:rgba(22,160,176,0.55);
    transform:rotate(-42deg);top:-11px;left:-30px}
  .tape.b{left:auto;right:-30px;transform:rotate(42deg)}
  .milo{position:absolute;z-index:3}
  .milo img{display:block;width:100%;height:auto;
    filter:drop-shadow(-12px 14px 0 rgba(28,24,19,0.18))}
  .plaque{position:absolute;z-index:5;
    filter:drop-shadow(-11px 12px 0 rgba(28,24,19,0.22))}
  .plaque>img{display:block;width:100%;height:auto}
  .plaque .eng{position:absolute;top:17%;left:6%;height:66%;aspect-ratio:1.036;
    mix-blend-mode:multiply;opacity:0.92}
  .plaque .eng svg{width:100%;height:100%;display:block}
  .plaque .nm{position:absolute;right:6%;top:50%;transform:translateY(-50%);
    font-weight:900;letter-spacing:0.05em;color:#2a1408;
    mix-blend-mode:multiply;opacity:0.88}
  .swoosh{position:absolute;z-index:2;inset:0}
  .doodle{position:absolute;z-index:4}
  .cta{position:absolute;z-index:6;background:var(--teal);color:#fff;
    font-weight:800;font-size:22px;letter-spacing:0.02em;padding:15px 30px;
    border-radius:999px;box-shadow:-6px 8px 0 rgba(28,24,19,0.20)}
  .tagline{position:absolute;z-index:6;font-weight:800;font-size:28px;
    color:var(--ink);letter-spacing:-0.01em}
`;

interface Assets {
  logo: string;
  photo: string;
  milo: string;
  plaque: string;
  engBurnt: string;
}

function chip(a: Assets, style: string): string {
  return `<div class="chip" style="${style}">
    <span class="tape"></span><span class="tape b"></span>
    <img src="${a.photo}"/><div class="cap">started as this phone pic</div></div>`;
}

function plaque(a: Assets, style: string, nameSize: number): string {
  return `<div class="plaque" style="${style}">
    <img src="${a.plaque}"/><div class="eng">${a.engBurnt}</div>
    <div class="nm" style="font-size:${nameSize}px">MILO</div></div>`;
}

/* ---------------- Comp A: cascade — three even beats, one swoosh ---------- */
function compA(a: Assets): string {
  // One continuous dashed line: leaves the chip, dives under LIKE through the
  // engraving, hooks back left and lands on the plaque (arrowhead).
  const swoosh = `
  <svg class="swoosh" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none"
       stroke="#16A0B0" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 26">
    <path d="M 1010 330 C 1300 380, 1420 430, 1310 540 C 1230 620, 1080 600, 1010 690 C 950 770, 1080 760, 1180 800"/>
  </svg>
  <svg class="swoosh" width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="#16A0B0"
       stroke-width="7" stroke-linecap="round" stroke-linejoin="round"
       style="left:1160px;top:770px;width:60px;height:60px">
    <path d="M14 6 L 46 28 L 8 40"/>
  </svg>`;
  return `<div class="stage">
    <div class="word" style="left:84px;top:128px;font-size:250px;transform:rotate(-1.5deg)">JUST</div>
    ${chip(a, "left:790px;top:92px;transform:rotate(5deg)")}

    <div class="word" style="right:84px;top:418px;font-size:250px;transform:rotate(1.2deg)">LIKE</div>
    <div class="milo" style="left:856px;top:368px;width:440px;
      -webkit-mask-image:linear-gradient(to bottom,#000 78%,transparent 98%);
      mask-image:linear-gradient(to bottom,#000 78%,transparent 98%)">
      <img src="${a.milo}"/></div>

    <div class="word" style="left:84px;top:708px;font-size:250px;transform:rotate(-1.2deg)">THAT</div>
    ${plaque(a, "left:820px;top:716px;width:420px;transform:rotate(-4deg)", 48)}

    ${swoosh}
    <div class="doodle" style="top:368px;left:760px">${sparkle(44, 10)}</div>
    <div class="doodle" style="top:96px;left:710px">${sparkle(34, -12)}</div>
    <div class="doodle" style="top:660px;left:1330px">${sparkle(52, 20)}</div>

    <div class="eyebrow">Magic Engraver</div>
    <div class="logo"><img src="${a.logo}"/></div>
    <div class="tagline" style="right:84px;bottom:122px">One photo in. An heirloom out.</div>
    <div class="cta" style="right:84px;bottom:40px">Try Magic Engraver</div>
  </div>`;
}

/* ------------- Comp B: big swing — Milo stays the hero anchor ------------- */
function compB(a: Assets): string {
  const arrows = `
  <svg class="swoosh" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none"
       stroke="#16A0B0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 1010 360 C 1180 400, 1330 460, 1430 540" stroke-dasharray="2 26"/>
    <path d="M 1390 500 L 1436 546 L 1366 562" />
    <!-- "snap" ticks: the plaque just appeared -->
    <path d="M 852 700 L 884 728"/>
    <path d="M 806 754 L 848 766"/>
    <path d="M 902 662 L 916 700"/>
  </svg>`;
  return `<div class="stage">
    <div class="word" style="left:84px;top:120px;font-size:280px">JUST</div>
    ${chip(a, "left:846px;top:86px;transform:rotate(6deg)")}

    <div class="word" style="right:570px;top:400px;font-size:280px">LIKE</div>
    <div class="milo" style="left:1290px;bottom:-14px;width:600px">
      <img src="${a.milo}"/></div>

    <div class="word" style="left:84px;top:756px;font-size:280px">THAT</div>
    ${plaque(a, "left:880px;top:744px;width:460px;transform:rotate(-5deg);z-index:5", 52)}

    ${arrows}
    <div class="doodle" style="top:284px;left:1150px">${sparkle(48, 10)}</div>
    <div class="doodle" style="top:100px;left:744px">${sparkle(36, -12)}</div>
    <div class="doodle" style="top:560px;left:700px">${sparkle(40, 18)}</div>

    <div class="eyebrow">Magic Engraver</div>
    <div class="logo"><img src="${a.logo}"/></div>
    <div class="tagline" style="right:84px;top:142px;font-size:26px">One photo in. An heirloom out.</div>
    <div class="cta" style="right:84px;top:200px">Try Magic Engraver</div>
  </div>`;
}

async function main() {
  const a: Assets = {
    logo: await dataUri("brand/logo/logo-full-250.png", "image/png"),
    photo: await dataUri("assets/magic-engraver/milo-photo.jpg", "image/jpeg"),
    milo: await dataUri("assets/magic-engraver/milo-cutout.png", "image/png"),
    plaque: await dataUri("assets/magic-engraver/plaque-walnut.png", "image/png"),
    engBurnt: stripMM(
      await readFile(resolve(REPO_ROOT, "assets/magic-engraver/milo-engraved.svg"), "utf8"),
    ).replaceAll("#000000", "#2a1408"),
  };

  for (const [name, body] of [["a", compA(a)], ["b", compB(a)]] as const) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${SHARED_CSS}</style></head><body>${body}</body></html>`;
    const out = await renderSvg({ markup: html, width: W, height: H, outPath: `output/hero-comp-${name}.png` });
    console.log(`✓ ${out.outPath}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
