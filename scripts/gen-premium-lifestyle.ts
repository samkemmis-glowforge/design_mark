import { generateImage } from "../agent/tools/generate-image.js";
const res = await generateImage({
  prompt:
    "Minimal warm lifestyle photograph, natural window light: ONE finished laser-cut wooden " +
    "desk organizer holding a couple of pens, sitting on a clean light-oak table, placed toward " +
    "the upper-right of the frame. The rest of the table is EMPTY — generous negative space in " +
    "the lower-left foreground. Soft morning light, gentle shadow, shallow depth of field, cozy " +
    "maker studio mood. Very minimal, uncluttered, calm. The engraving is a simple abstract motif " +
    "(no readable words). NO text, NO logos, NO screens, no extra props.",
  aspectRatio: "1:1",
  outPath: "assets/premium/lifestyle-minimal.png",
});
console.log(JSON.stringify(res));
