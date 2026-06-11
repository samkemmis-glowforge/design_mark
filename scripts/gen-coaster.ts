import { generateImage } from "../agent/tools/generate-image.js";
const res = await generateImage({
  prompt:
    "Overhead top-down lifestyle product photograph: a single round walnut wood coaster with a " +
    "slightly raised rim, centered on a rustic reclaimed-wood table with visible grain and warm " +
    "patina. The rim of a speckled cream ceramic mug of black coffee enters the top-right corner " +
    "of the frame; a corner of natural oatmeal linen cloth enters the bottom-left. Soft warm " +
    "morning window light from the left, gentle natural shadows. The coaster face is completely " +
    "blank smooth walnut wood — no text, no engraving, no logo, no props on the coaster.",
  aspectRatio: "1:1",
  outPath: "/tmp/milo/coaster-scene.png",
});
console.log(JSON.stringify(res));
