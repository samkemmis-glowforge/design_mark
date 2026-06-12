import { generateImage } from "../agent/tools/generate-image.js";
const res = await generateImage({
  prompt:
    "Overhead top-down lifestyle product photograph: a single round LIGHT OAK wood coaster " +
    "with a pale, warm, blond wood grain and a slightly raised rim, centered on a light natural " +
    "ash-wood table. The rim of a speckled cream ceramic mug of coffee enters the top-right corner; " +
    "a corner of natural oatmeal linen enters the bottom-left. Bright, soft, airy morning light, " +
    "gentle shadows. The coaster face is completely blank smooth pale oak wood — no text, no " +
    "engraving, no logo, no props on the coaster.",
  aspectRatio: "1:1",
  outPath: "assets/magic-engraver/coaster-scene.png",
});
console.log(JSON.stringify(res));
