import { readFile } from "node:fs/promises";
import { renderSvg } from "../agent/tools/render-svg.js";
const pacifico = (await readFile("node_modules/@fontsource/pacifico/files/pacifico-latin-400-normal.woff2")).toString("base64");
await renderSvg({
  markup: `<!doctype html><html><head><style>
    @font-face{font-family:'Pacifico';src:url(data:font/woff2;base64,${pacifico}) format('woff2')}
    html,body{margin:0;background:transparent}
    div{font-family:'Pacifico';font-size:120px;color:#2a1408;text-align:center;width:520px}
  </style></head><body><div>Milo</div></body></html>`,
  width: 520, height: 200, outPath: "assets/magic-engraver/name-milo.png", omitBackground: true,
});
console.log("name png done");
