import { generateImage } from "../agent/tools/generate-image.js";

/** Gemini-drawn doodle marks. First mark establishes the pen; the rest take
 * it as a style reference so the set reads as one hand. */
const STYLE =
  "drawn casually with a fine black felt-tip pen on a pure white background. " +
  "Confident, loose, imperfect handwriting energy. Thin consistent line weight, " +
  "no shading, no shadow, no texture, no border — a single isolated doodle, " +
  "large, centered, with generous white margins. Nothing else in the image.";

const MARKS: [string, string][] = [
  ["arrow-swoosh", "a gently curving arrow whose tail is a dotted line, with a small open V arrowhead"],
  ["arrow-straight", "a mostly straight horizontal arrow with a small open V arrowhead"],
  ["arrow-loop", "an arrow whose tail does one playful loop-de-loop before pointing right"],
  ["underline-squiggle", "a single horizontal squiggly wave underline"],
  ["underline-rough", "a rough double-stroke horizontal underline, two quick overlapping passes"],
  ["circle-loop", "a loose hand-drawn oval for circling a word, ends overlapping with a slight overshoot"],
  ["asterisk", "a simple six-pointed asterisk made of three crossing strokes"],
  ["burst", "a small radiating burst of six short ticks around an empty center"],
  ["sparkle", "a four-pointed sparkle star outline"],
  ["snap-ticks", "three short emphasis ticks radiating from a corner, comic style"],
];

const refs: string[] = [];
for (const [name, desc] of MARKS) {
  const res = await generateImage({
    prompt: `Minimal hand-drawn doodle: ${desc}, ${STYLE}`,
    aspectRatio: "1:1",
    outPath: `/tmp/milo/marks-raw/${name}.png`,
    references: refs.length ? [refs[0]] : undefined,
  });
  console.log(`✓ ${name}`);
  if (!refs.length) refs.push(res.outPath);
}
