# Glowforge — Brand Spec (instructions to the designer)

> This is the agent-readable creative brief. Read it before producing anything.
> It pairs with `brand.json` (machine-readable tokens). Where this file and a brief
> conflict, ask the human. **Rough-but-real beats polished-but-generic** — invest in
> the swipe file in `references/`.

## Who we are

Glowforge makes magic feel makeable. The brand is **modern, energetic, creative,
fun, and personable** — never corporate, sterile, or intimidating. The tagline is
**"Make Something Magical.™"** Everything should feel like it invites a real person
to make something with their own hands.

The audience is makers and creators — hobbyists, small-business crafters, and
curious beginners. Talk to a capable human, not a "user." Celebrate _their_ work.

## Color — this is our strongest brand asset

Color lets people recognize us before they read our name. **Teal is the hero.**
Use it as the dominant identity color. The full system (base + one tint + one shade
per family) lives in `brand.json` under `palette`.

| Family | Base | Use for |
| --- | --- | --- |
| **Teal** (primary) | `#16A0B0` | CTAs, accents, line icons, hero/brand moments (matches logomark + live-site CTAs) |
| **Purple** (accent) | `#821AAB` | High-energy contrast, highlights, CTAs against teal/cream |
| **Cream/Sand** | `#F9E7CB` | Warm neutral surfaces, soft sections |
| **Yellow** | `#FFE677` | Optimistic accents, highlights |
| **Coral** | `#FFA399` | Friendly warm accents |
| **Cobalt Blue** | `#001195` | Cool anchor, deep contrast |
| **Rust** | `#63241A` | Earthy/material warmth (wood, leather) |
| **Ink** | `#12151A` | Body text, dark backgrounds |

### How to combine colors (always do)
- Think on **two axes**: warm↔cool and light↔dark.
- For a punchy two-color combo, pick one color and pair it with a color **diagonally
  across the spectrum** (e.g. cool+dark teal with a warm+light cream or coral). This
  creates the dynamic, slightly-unexpected contrast the brand is known for.
- For calm, layered depth, go **tone-on-tone**: a base with its own tint or shade,
  choosing the one that contrasts the background for legibility.
- Each family ships exactly **one tint and one shade** — use them to pace content and
  create depth, not to invent new colors.

### Logo / wordmark color
- On a **light** background → wordmark and type in a dark brand color (Ink `#12151A`
  or a family shade).
- On a **dark** background → wordmark and type **always white** `#FFFFFF`.

### Never do (color)
- Don't introduce colors outside the palette.
- Don't tint/shade beyond the provided one-tint-one-shade per family.
- Don't put low-contrast text on a busy color field — legibility wins over cleverness.
- Don't make it muddy: combinations should feel bright and intentional, not washed out.

## Typography — TODO (needs the Type section)

The Color deck uses a **rounded geometric sans-serif**, but the brand's actual
typeface wasn't in the section provided. `brand.json` currently falls back to
**Inter** for rendering. **Do not treat the font as final** — flag it on any asset
where type is prominent, and ask the human for the real typeface (and whether it's a
Google Font or a licensed file we need for Playwright).

When set: headlines are confident and clean; keep generous line-height and let
whitespace breathe. Sentence case for most UI/marketing; the tagline keeps its
title-case styling: **Make Something Magical.™**

## Photography & illustration style — TODO (needs more of the book + swipe file)

What we can infer so far:
- Real **maker products, materials, and prints** are the source of our color and our
  imagery — show actual made things, in-progress projects, and authentic hands-on
  moments (the "Homemade Is Better" / UGC spirit).
- Favor bright, true color over moody/desaturated looks.
- For anything showing our **actual product UI**, get a real screenshot and composite
  it — never let an image model invent the interface.

Populate `references/` (5–15 admired/competitor screenshots) and `exemplars/` (our
own correct assets) to lock this down. This swipe file moves quality more than any
prompt.

## Voice in visuals (example phrasings)

Headlines should sound encouraging, concrete, and a little playful:
- "Make Something Magical."
- "Your idea. Made real."
- "From screen to shelf in minutes."
- "If you can dream it, you can make it."

Avoid: jargon, hype-y superlatives, anything that sounds like enterprise SaaS.

## Status of this spec
- ✅ Color system — complete, sampled from the official Color guidelines.
- ✅ Primary hierarchy — confirmed: Teal primary, Purple accent.
- ◻️ Typography — confirmed to ship on **Inter** for now; swap when the Type section / font files arrive.
- ⛔ Logo — file not yet provided.
- ⛔ References — none yet; exemplars (below) seed the swipe file in the meantime.
- ◻️ Exemplars — human is providing our own correct past assets.
- ◻️ Spacing / radius — sensible defaults; confirm against the brand book.
