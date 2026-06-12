import { readFile } from "node:fs/promises";
import { renderSvg } from "../agent/tools/render-svg.js";
// P1 composite: ring-clipped photo + pop-out cutout, transparent bg.
// Triptych canvas coords shifted by (-60,-360) into a 560x580 local canvas.
const photo = `data:image/jpeg;base64,${(await readFile("assets/magic-engraver/milo2.jpg")).toString("base64")}`;
const cut = `data:image/png;base64,${(await readFile("assets/magic-engraver/milo2-cutout.png")).toString("base64")}`;
const [popLeft, popTop, popW, popH] = [5.4 - 60, 373.2 - 360, 543.4, 724.5];
const [cx, cy, D, PAD] = [320 - 60, 650 - 360, 450, 6];
await renderSvg({
  markup: `<div style="position:absolute;left:${cx - D/2 - PAD}px;top:${cy - D/2 - PAD}px;width:${D}px;height:${D}px;
      border-radius:50%;overflow:hidden;border:${PAD}px solid #1C1813;background:#fff">
      <img src="${photo}" style="position:absolute;left:${popLeft - (cx - D/2)}px;top:${popTop - (cy - D/2)}px;width:${popW}px;height:${popH}px"/>
    </div>
    <img src="${cut}" style="position:absolute;left:${popLeft}px;top:${popTop}px;width:${popW}px;height:${popH}px"/>`,
  width: 560, height: 580, outPath: "assets/hero-layers/milo-photo-popout.png", omitBackground: true,
});
console.log("popout done");
