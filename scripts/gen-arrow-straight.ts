import { generateImage } from "../agent/tools/generate-image.js";
await generateImage({
  prompt:
    "Minimal hand-drawn doodle: a plain horizontal line that ends in a simple arrowhead " +
    "made of just two short angled strokes (like a greater-than sign >). NOT an archery arrow: " +
    "no feathers, no fletching, no filled triangle. Drawn casually with a fine black felt-tip " +
    "pen on a pure white background, thin consistent line weight matching the reference pen, " +
    "single isolated doodle, large, centered, nothing else in the image.",
  aspectRatio: "1:1",
  outPath: "/tmp/milo/marks-raw/arrow-straight.png",
  references: ["/tmp/milo/marks-raw/arrow-swoosh.png"],
});
console.log("done");
