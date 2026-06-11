# design_mark — agent working notes

## Design review discipline (mandatory before showing any render to a human)

The agent's defects come from composing blind and grading its own work
generously. Counter both, every iteration:

1. **Never judge from one downscaled thumbnail.** Run
   `python3 scripts/review-sheet.py output/<render>.png` — it archives the
   render, builds PREV|CURRENT pairwise, 1:1 region crops (from the render's
   `.checks.json`), and the reference bar from `assets/design-references/`.
   Review the sheet, zoomed regions included.
2. **Judge pairwise, not absolute.** Is CURRENT better than PREV? Is it at
   the reference bar? Absolute "this looks good" self-scores are unreliable
   (score compression / self-sycophancy — see docs/design-feedback-research.md).
3. **Fixed rubric, every time:**
   - Flow: where does the eye land first / second / third? Is there ONE
     dominant focal point?
   - Type: hierarchy readable at thumbnail size? Any orphaned text?
   - Whitespace: is every empty region intentional (margins, breathing room)
     or residue?
   - Crops/subjects: every subject centered per design-check; nothing clipped
     unintentionally.
   - Restraint: ≤2 dominant colors + accent; one full-color moment.
4. **Report flaws first.** Lead with what is wrong or uncertain before any
   self-praise. If a flaw is dismissed as "taste", say so explicitly so the
   human can overrule.
5. **Deterministic checks must pass first**: render scripts emit
   `*.checks.json`; `python3 scripts/design-check.py <render> <checks>` must
   PASS before human review.

## Layout rules

- Compose with relationships, not pixels: `agent/render/layout.ts`
  (`coverCrop`, `overlayOnSubject`, `makeGrid`). No hand-tuned crop offsets.
- Subject boxes live in `assets/magic-engraver/subjects.json` — verified with
  crosshair overlays once per asset, then corrected from *measured* pixels
  (design-check reports detected centers; pixels overrule eyeballs).

## Process

- Lock geometry/concept with the human first (lo-fi comps, batched variants
  in one render pass), then iterate the winner. Human taste at cheap
  checkpoints; never polish singles between human looks.
- Brand: cream #F9E7CB, teal #16A0B0, ink #1C1813; tokens in brand/brand.json.
  Inter 400–900 embedded; Pacifico available for engraved-name lettering.
- Review any image cheaply: `python3 scripts/vet-drive-asset.py <file> [out]`
  (downscale / montage). Gemini image gen: `IMAGE_PROVIDER=gemini`; fall back
  `GEMINI_IMAGE_MODEL=gemini-2.5-flash-image` on 503s.
