import { renderTemplate } from "../agent/tools/render-template.js";

/**
 * Phase 1 acceptance driver: render the feature-section template with sample
 * content across a couple of themes, proving tokens flow through and that
 * swapping content/colors changes the output.
 */
async function main() {
  const a = await renderTemplate({
    template: "feature-section",
    content: {
      eyebrow: "New in Glowforge",
      headline: "Make Something Magical.",
      body: "Introducing the Layer tool — stack, align, and engrave multi-part designs in a single pass. From idea to finished piece in minutes.",
      cta: "See how it works",
      theme: "light",
    },
    outPath: "output/sample-feature-light.png",
  });
  console.log(`✓ ${a.outPath} (${a.width}×${a.height})`);

  const b = await renderTemplate({
    template: "feature-section",
    content: {
      eyebrow: "Homemade is better",
      headline: "Your idea. Made real.",
      body: "Bring your own materials and let Glowforge do the precise part. Every project, on-brand and on-time.",
      cta: "Start making",
      theme: "teal",
    },
    outPath: "output/sample-feature-teal.png",
  });
  console.log(`✓ ${b.outPath} (${b.width}×${b.height})`);

  process.exit(0);
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
