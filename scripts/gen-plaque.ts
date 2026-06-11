import { generateImage } from "../agent/tools/generate-image.js";
const res = await generateImage({
  prompt:
    "Product photograph of a blank rectangular walnut wood wall plaque with softly rounded corners, " +
    "perfectly front-facing and centered, on a pure white background. Soft, even studio lighting, " +
    "rich visible wood grain, slight natural sheen. No text, no engraving, no props, no hardware.",
  aspectRatio: "1:1",
  outPath: "/tmp/milo/plaque-raw.png",
});
console.log(JSON.stringify(res));
