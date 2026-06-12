import { readFile, readdir } from "node:fs/promises";
import { renderSvg } from "../agent/tools/render-svg.js";

// Preview sheet for assets/marks: each mark in teal on light + cream on dark,
// plus in-context rows (circled word, underlined word, swoosh between steps).
const files = (await readdir("assets/marks")).filter((f) => f.endsWith(".svg")).sort();
const svgs: Record<string, string> = {};
for (const f of files) svgs[f] = await readFile(`assets/marks/${f}`, "utf8");

const cell = (name: string, color: string) =>
  `<div style="width:170px;text-align:center">
     <div style="height:90px;display:flex;align-items:center;justify-content:center;color:${color}">
       <div style="width:120px">${svgs[name]}</div>
     </div>
     <div style="font-size:13px;font-weight:600;opacity:.7">${name.replace(".svg", "")}</div>
   </div>`;

const row = (bg: string, fg: string) =>
  `<div style="background:${bg};padding:18px 24px;display:flex;flex-wrap:wrap;gap:6px">
     ${files.map((f) => cell(f, fg)).join("")}
   </div>`;

const html = `<div style="font-family:Inter,sans-serif;width:1840px">
  ${row("#FDF8F1", "#16A0B0")}
  ${row("#0E454D", "#F9E7CB")}
  <div style="background:#FDF8F1;padding:34px 24px 48px;display:flex;gap:80px;align-items:center;color:#1C1813">
    <span style="font-weight:900;font-size:44px;position:relative">heirloom
      <span style="position:absolute;left:-9%;top:-18%;width:118%;color:#16A0B0">${svgs["circle-loop.svg"]}</span>
    </span>
    <span style="font-weight:900;font-size:44px;position:relative">one photo
      <span style="position:absolute;left:0;bottom:-30px;width:100%;color:#16A0B0">${svgs["underline-squiggle.svg"]}</span>
    </span>
    <span style="display:flex;align-items:center;gap:14px;font-weight:800;font-size:26px">
      PHOTO <span style="width:120px;color:#16A0B0">${svgs["arrow-swoosh.svg"]}</span> ENGRAVING
    </span>
    <span style="font-weight:900;font-size:44px;position:relative">that easy<span style="position:absolute;right:-46px;top:-22px;width:38px;color:#16A0B0">${svgs["asterisk.svg"]}</span></span>
  </div>
</div>`;

await renderSvg({ markup: html, width: 1840, height: 580, outPath: "output/marks-preview.png" });
console.log("preview done");
