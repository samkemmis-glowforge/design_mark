import { generateImage } from "../agent/tools/generate-image.js";
const res = await generateImage({
  prompt: "A single red apple on a plain white background, studio photo",
  aspectRatio: "1:1",
  outPath: "output/gemini-smoke-test.png",
});
console.log(JSON.stringify(res));
