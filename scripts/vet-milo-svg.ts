import { readFileSync } from "node:fs";
import { htmlToPng } from "../agent/render/html-to-png.js";
const svg = readFileSync("assets/magic-engraver/milo-engraved.svg", "utf8")
  .replace("<svg ", '<svg style="width:700px;height:auto" ');
await htmlToPng({
  html: `<body style="margin:0;background:#fff">${svg}</body>`,
  width: 700, height: 680, outPath: "/tmp/milo/engraved.png",
});
console.log("done");
