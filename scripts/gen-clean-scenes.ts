import { generateImage } from "../agent/tools/generate-image.js";

/** Remove the coffee cup from both base scenes (cleaner), preserving everything else. */

const JOBS = [
  {
    ref: "assets/campaign/app-catalog.png",
    out: "assets/campaign/chars-clean.png",
    prompt: `Edit this photo: COMPLETELY REMOVE the paper coffee cup standing between/behind the two wooden
character figurines. Fill the area where the cup was with the natural craft-studio background (blurred shelves and
wall) up top and the light wood desk surface lower down, seamlessly and photorealistically. Keep the two wooden
figurines (the bespectacled fox on the left and the bunny on the right), the desk, the scattered wood pieces, the
lighting, and the background EXACTLY as they are. Do not add anything new. Natural, believable result.`,
  },
  {
    ref: "assets/campaign/designapp-scene.png",
    out: "assets/campaign/designapp-clean.png",
    prompt: `Edit this image: COMPLETELY REMOVE the paper coffee cup that sits near the finished wooden figurines on
the right side. Fill where it was with the light wood desk surface and the blurred studio background seamlessly and
photorealistically. Keep the laptop showing the vector design app, the two finished wooden figurines (fox and bunny),
the desk, and the lighting EXACTLY as they are. Do not add anything new.`,
  },
];

async function main() {
  process.env.IMAGE_PROVIDER = "gemini";
  const models = ["gemini-3-pro-image", "gemini-2.5-flash-image"];
  for (const job of JOBS) {
    let done = false;
    for (const model of models) {
      process.env.GEMINI_IMAGE_MODEL = model;
      try {
        const r = await generateImage({ prompt: job.prompt, aspectRatio: "1:1", references: [job.ref], outPath: job.out });
        console.log(`✓ ${r.outPath} via ${model}`); done = true; break;
      } catch (e) { console.error(`✗ ${model}: ${e instanceof Error ? e.message : e}`); }
    }
    if (!done) { console.error(`failed: ${job.out}`); process.exit(1); }
  }
  process.exit(0);
}
main();
