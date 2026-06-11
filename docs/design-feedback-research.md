# How companies give AI agents visual design feedback — research dive

*Compiled 2026-06-11. Question: our agent renders marketing graphics (HTML/SVG →
headless Chromium → PNG) and iterates by eyeballing downscaled screenshots; it
misses what designers catch instantly (off-center faces in crops, flow,
whitespace). How is this solved in industry/research, and what can we integrate?*

---

## Finding 1 — Production systems mostly PREVENT bad design, they don't detect it

Every commercial system surveyed constrains generation so quality is guaranteed
upstream, rather than QA-ing free-form output downstream:

- **Canva Brand Templates + Autofill API**: human-designed template fixes all
  layout/typography; the API only fills named data slots.
  [canva.dev/docs/connect/autofill-guide](https://www.canva.dev/docs/connect/autofill-guide/)
- **Template-render APIs (Bannerbear, Abyssale, Robolly, Placid, Templated.io)**:
  same model. Their AI features target the one thing data injection breaks:
  text auto-resize, **face detection for image positioning**, smart crop.
  [bannerbear.com/product/image-generation-api](https://www.bannerbear.com/product/image-generation-api/)
- **Adobe Firefly Services**: template-driven bulk variants, Generative Expand
  for resizes, brand control via custom models.
  [developer.adobe.com/firefly-services/docs/guides](https://developer.adobe.com/firefly-services/docs/guides/)
- **v0 (Vercel)** constrains output to a design system/component registry;
  **Google Stitch** maintains a generated DESIGN.md spec as source of truth.
  [vercel.com/blog/ai-powered-prototyping-with-design-systems](https://vercel.com/blog/ai-powered-prototyping-with-design-systems)
- Wix's layout-generation research still validates against aesthetic metrics and
  fixed element classes.
  [wix.engineering — AI-based layout generation](https://www.wix.engineering/post/beyond-content-generation-ai-based-layout-generation-for-graphic-design)

**Notably: none publicly document post-render automated QA.** Constraint beats
inspection in production.

## Finding 2 — Vision-feedback loops exist and work, with measured limits

- **Figma's agent platform** ships the clearest production loop: agent generates
  a screen → screenshots it → iterates on mismatches, correcting against real
  structure (components/auto-layout).
  [figma.com/blog/the-figma-canvas-is-now-open-to-agents](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/)
- **VASCAR** (poster layout): render → feed back to LVLM with automatic metrics
  (occlusion, alignment, readability) → adjust; SOTA after ~15 iterations, but
  over-iteration degrades results.
  [arXiv 2412.04237](https://arxiv.org/html/2412.04237v1)
- **AesthetiQ** (CVPR 2025): VILA-7B as **pairwise** aesthetic judge over layout
  candidates; 78.8% judge–human agreement.
  [arXiv 2503.00591](https://arxiv.org/html/2503.00591)
- **Design2Code / ReLook**: self-revision from screenshots of own renders;
  gains real but marginal per iteration.
  [salt-nlp.github.io/Design2Code](https://salt-nlp.github.io/Design2Code/)
- Practitioner pattern: Playwright-MCP screenshot loops in coding agents
  ("10+ iterations → 2-3").
  [tweag.github.io/agentic-coding-handbook](https://tweag.github.io/agentic-coding-handbook/WORKFLOW_VISUAL_FEEDBACK/)

## Finding 3 — What VLM judges catch vs. miss (why Milo's face was off-center)

- **Catch**: clutter, bad contrast, overlap, gross imbalance (UICrit,
  AesEval-Bench).
- **Miss**: *precise spatial defects* — small misalignments, spacing
  inconsistency, **off-center crops** — due to weak spatial grounding
  (AesEval-Bench's localization task; ICLR 2026).
  [arXiv 2603.01083](https://arxiv.org/abs/2603.01083)
- **Score compression**: absolute 1–10 scores cluster; pairwise comparison is
  far more reliable (AesthetiQ).
- **Visual sycophancy**: VLMs often suppress detected anomalies to agree with
  the user (~70% of conflict cases). [arXiv 2603.18373](https://arxiv.org/pdf/2603.18373)
- What helps (measured): few-shot expert critiques (+55% feedback quality,
  UICrit [arXiv 2407.08850](https://arxiv.org/abs/2407.08850)); grid/numbered-patch
  overlays on the screenshot (+5–10% spatial accuracy); decomposed rubrics;
  **two-pass critique-then-localize** — Google's *Visual Prompting with
  Iterative Refinement for Design Critique* closed ~50% of the human gap and
  found that combining critique + localization in one call degrades both.
  [arXiv 2412.16829](https://arxiv.org/abs/2412.16829)

## Finding 4 — Programmatic checks: cheap, deterministic, cover our exact bugs

- **smartcrop.js / smartcrop-sharp**: content-aware crop suggestions
  (`{x,y,w,h}` + scores), accepts face-box "boost" regions; <20 ms.
  [github.com/jwagner/smartcrop.js](https://github.com/jwagner/smartcrop.js/)
- **Face detection (local)**: MediaPipe Tasks Vision (Node/WASM) or
  @vladmandic/face-api → boxes + landmarks → "face center vs. crop center"
  delta is a one-line rule. Pet faces: MediaPipe is human-tuned; for dogs,
  GCV object localization or a YOLO pet-face model works.
- **Google Cloud Vision**: FACE_DETECTION + **CROP_HINTS** (suggested crops per
  aspect ratio with confidence); $1.50/1k after free tier.
  [cloud.google.com/vision/docs/crop-hints](https://docs.cloud.google.com/vision/docs/crop-hints)
- **Aalto Interface Metrics (AIM)**: open-source; ~17 validated metrics on a
  screenshot (clutter, symmetry/balance, whitespace, grid quality).
  [github.com/aalto-ui/aim](https://github.com/aalto-ui/aim)
- **UIClip** (CMU/Apple, UIST 2024): CLIP fine-tuned for UI design-quality
  scoring; weights on HF (`biglab/uiclip_*`).
  [arXiv 2404.12500](https://arxiv.org/abs/2404.12500)
- **axe-core** in our existing headless Chromium: WCAG contrast + a11y JSON
  violations against the live DOM.
  [github.com/dequelabs/axe-core](https://github.com/dequelabs/axe-core)
- LAION aesthetic predictor: photo-prettiness, wrong distribution for graphic
  design — skip. [laion.ai/blog/laion-aesthetics](https://laion.ai/blog/laion-aesthetics/)

## Recommendation for this repo (layered, v1 ≈ 3–5 days)

1. **Constraint layer (biggest win, zero new deps)**: stop hand-placing pixels.
   Encode a grid + spacing tokens in the render scripts; express crops as
   "subject-centered" *operations* (compute the crop from a detected subject
   box) instead of magic numbers. This is what Canva/Bannerbear do.
2. **Deterministic check layer** (`agent/tools/design-check.ts`): after each
   render — (a) subject/face detection (GCV or MediaPipe + smartcrop boost) and
   assert subject-center ≈ crop-center for every circular/rect crop;
   (b) axe-core contrast pass in the same browser; (c) edge-projection
   alignment check (do element edges share gridlines); (d) text-overflow probe.
   Output: JSON violations the agent must fix before showing a human.
3. **VLM review layer**: review renders at full res with region zooms, a fixed
   decomposed rubric (typography / layout-flow / color / crop quality),
   **pairwise against the previous iteration** ("which is better and why"),
   with detected-box overlays burned in before review.
4. **Optional scorer**: AIM or UIClip as a sidecar regression score per render.

*Search/verification: 5 parallel research agents, ~15 primary sources fetched,
claims tagged high/medium/low confidence by source quality (papers + official
docs > blogs).*
