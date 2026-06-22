import { generateImage } from "../agent/tools/generate-image.js";
const res = await generateImage({
  prompt:
    "Warm, cozy maker-studio lifestyle photograph, natural window light: an assortment of " +
    "finished laser-cut and laser-engraved projects arranged on a light oak worktable — a " +
    "wooden desk organizer, a small engraved wooden sign, a few pieces of engraved wood-and-" +
    "acrylic jewelry, a personalized coaster. Handmade, tactile, inviting; soft shadows, shallow " +
    "depth of field. NO text, NO logos, NO screens. Editorial maker aesthetic, not sterile product shot.",
  aspectRatio: "1:1",
  outPath: "assets/premium/lifestyle-projects.png",
});
console.log(JSON.stringify(res));
