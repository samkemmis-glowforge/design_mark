import { generateImage } from "../agent/tools/generate-image.js";

/**
 * Have Gemini DRAW two hand-drawn, comic-style speech bubbles into the clean
 * characters scene — left bubble over the fox, right bubble over the bunny — left
 * BLANK inside (crisp slogan text is overlaid later in the render step).
 */

const PROMPT = `Edit this image: add TWO big, bold, HAND-DRAWN comic-style speech bubbles, like a chunky ink-marker
doodle — white fill with a thick, slightly wobbly, imperfect hand-drawn black outline (not a clean vector shape).
Place ONE large speech bubble in the upper-LEFT area, its pointed tail aimed straight down at the wooden FOX figure.
Place the OTHER large speech bubble in the upper-RIGHT area, its pointed tail aimed straight down at the wooden
BUNNY figure. Make the bubbles large and sit close above each character so each clearly "speaks".
Leave the INSIDE of each bubble COMPLETELY BLANK white — absolutely NO text, NO letters, NO numbers, NO scribbles
inside. Keep the two wooden characters, the desk, and the background exactly as they are.`;

async function main() {
  process.env.IMAGE_PROVIDER = "gemini";
  const models = ["gemini-3-pro-image", "gemini-2.5-flash-image"];
  const ar = process.argv[2] ?? "1:1";
  const out = process.argv[3] ?? "assets/campaign/chars-bubbles-empty.png";
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
