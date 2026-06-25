import { generateImage } from "../agent/tools/generate-image.js";

/**
 * Have Gemini render the WHOLE thing: two hand-drawn speech bubbles WITH the
 * hand-lettered slogan inside — fox: "A better design app", bunny: "for every laser".
 * Text is Gemini's job here (per direction); verify spelling on the output.
 * Usage: tsx scripts/gen-bubbles-text.ts <aspectRatio> <outPath>
 */

const PROMPT = `Edit this image: add TWO big, bold, HAND-DRAWN comic-style speech bubbles (white fill, thick slightly wobbly
hand-drawn black ink outline, like a marker doodle — not a clean vector).

The LEFT speech bubble sits in the upper-left, its tail pointing down at the wooden FOX figure, and contains the
hand-lettered words exactly: "A better design app".
The RIGHT speech bubble sits in the upper-right, its tail pointing down at the wooden BUNNY figure, and contains the
hand-lettered words exactly: "for every laser".

Hand-letter the text in a bold, friendly, clearly legible style that fits neatly inside each bubble. Spell every word
EXACTLY as written above — no other letters or words. Color the phrases "design app" and "every laser" in teal
(#16A0B0); the other words in near-black. Keep the two wooden characters, the desk, and the background unchanged.`;

async function main() {
  process.env.IMAGE_PROVIDER = "gemini";
  const ar = process.argv[2] ?? "1:1";
  const out = process.argv[3] ?? "assets/campaign/chars-bubbles-text.png";
  const models = ["gemini-3-pro-image", "gemini-2.5-flash-image"];
  for (const model of models) {
    process.env.GEMINI_IMAGE_MODEL = model;
    try {
      const r = await generateImage({ prompt: PROMPT, aspectRatio: ar, references: ["assets/campaign/chars-clean.png"], outPath: out });
      console.log(`✓ ${r.outPath} (${r.width}x${r.height}) via ${model}`); process.exit(0);
    } catch (e) { console.error(`✗ ${model}: ${e instanceof Error ? e.message : e}`); }
  }
  process.exit(1);
}
main();
