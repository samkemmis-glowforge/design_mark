# Hand-drawn marks (Gemini-drawn) — primary kit

Ten doodle marks drawn by Gemini (one style-reference chain so the set reads
as one pen), processed to transparent PNGs:

  <name>.png        ink   #1C1813
  <name>-teal.png   teal  #16A0B0
  <name>-cream.png  cream #F9E7CB

Marks: arrow-swoosh (pipeline-step arrow), arrow-straight, arrow-loop,
underline-squiggle, underline-rough, circle-loop (circling a word),
asterisk, burst, sparkle, snap-ticks.

Trimmed to content +4% margin; alpha = ink, so they sit on any field.
Need another color? `python3 scripts/process-marks.py` regenerates from the
raw gens (or recolor any PNG: keep alpha, replace RGB). Vector alternatives
(currentColor SVGs, tidier feel) live in assets/marks/.
