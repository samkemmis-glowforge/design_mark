import { generateImage } from "../agent/tools/generate-image.js";

/**
 * Version B base scene: the characters shown in a design app on a computer,
 * next to the finished laser-cut pieces — the "design → make" story.
 * Conditioned on the original catalog photo so the characters match.
 */

const PROMPT = `Photorealistic bright, airy craft-studio desk scene, warm natural light, shallow depth of field.
On the LEFT: an open laptop on the light-wood desk, its screen showing a clean vector DESIGN APP — the app canvas
displays flat vector line-art outlines of a cartoon fox-with-glasses and a bunny-with-glasses (matching the wooden
figurines in the reference), with a simple, believable design-software toolbar and panels. The screen art is crisp
flat vectors, clearly "in progress on a computer."
On the RIGHT, in front: the two FINISHED laser-cut wooden characters from the reference — the bespectacled fox and
the bunny — standing on the desk as real physical objects, plus the engraved coffee cup.
Tell the story "designed on screen → made as a real object." Keep BOTH the laptop screen and the figurines fully
visible and centered with comfortable margin on all sides (so the scene can be cropped to square, portrait, and wide).
Minimal uncluttered background. No text overlays, no logos, no watermark, no gibberish lettering on the screen UI.`;

async function main() {
  const refs = ["assets/campaign/app-catalog.png"];
  const out = "assets/campaign/designapp-scene.png";
  process.env.IMAGE_PROVIDER = "gemini";
  const models = [process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image", "gemini-2.5-flash-image"];
  for (let i = 0; i < models.length; i++) {
    process.env.GEMINI_IMAGE_MODEL = models[i];
    try {
      const r = await generateImage({ prompt: PROMPT, aspectRatio: "1:1", references: refs, outPath: out });
      console.log(`✓ ${r.outPath} (${r.width}x${r.height}) via ${models[i]}`);
      process.exit(0);
    } catch (e) {
      console.error(`✗ ${models[i]}: ${e instanceof Error ? e.message : e}`);
      if (i === models.length - 1) process.exit(1);
      console.error("  retrying with fallback model…");
    }
  }
}
main();
