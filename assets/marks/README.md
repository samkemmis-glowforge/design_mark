# Hand-drawn marks kit

Companion doodles to the Magic Engraver pipeline art (same language as the
dotted swoosh arrows between steps): round caps, slight waver, `2 24` dash
rhythm on swooshes.

Usage
- All strokes are `currentColor` — set color via CSS (`color: #16A0B0` on
  the wrapper, or `color: #F9E7CB` on dark fields).
- All paths use `vector-effect="non-scaling-stroke"`: the pen stays ~3px at
  any rendered size, so the whole kit reads as one hand. Override weight via
  CSS (`svg path { stroke-width: 2.5 }`) if needed.
- `arrow-swoosh` is the drop-in replacement for the old pipeline-step arrows.
- `circle-loop` is sized to wrap a word: position absolutely over the text at
  ~118% width, slight negative top offset (see scripts/render-marks-preview.ts
  for a working example of all in-context placements).
- `underline-rough`'s second stroke carries `opacity:.65` internally.

Files: arrow-swoosh, arrow-straight, arrow-loop, underline-squiggle,
underline-rough, circle-loop, asterisk, burst, sparkle, snap-ticks.
