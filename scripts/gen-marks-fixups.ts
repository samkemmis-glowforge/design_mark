import { generateImage } from "../agent/tools/generate-image.js";
const STYLE =
  "drawn casually with a fine black felt-tip pen on a pure white background. " +
  "Confident, loose, imperfect handwriting energy. THIN consistent line weight " +
  "matching the reference image's pen exactly, no filled shapes, no shading, " +
  "no extra decoration — a single isolated doodle, large, centered. Nothing else.";
const MARKS: [string, string][] = [
  ["arrow-straight", "a mostly straight horizontal arrow pointing right; the head is a small OPEN V of two thin strokes, NOT a filled triangle"],
  ["snap-ticks", "exactly three short straight emphasis ticks fanning out from an invisible corner point, like comic-book impact lines"],
  ["sparkle", "one simple four-pointed sparkle (diamond star) outline, plain, with nothing around it"],
];
for (const [name, desc] of MARKS) {
  await generateImage({
    prompt: `Minimal hand-drawn doodle: ${desc}, ${STYLE}`,
    aspectRatio: "1:1",
    outPath: `/tmp/milo/marks-raw/${name}.png`,
    references: ["/tmp/milo/marks-raw/arrow-swoosh.png"],
  });
  console.log(`✓ ${name}`);
}
