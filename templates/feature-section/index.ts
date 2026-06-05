import type { Brand } from "../../agent/brand.js";
import { fontStack } from "../../agent/render/fonts.js";
import { esc, type TemplateContext, type TemplateModule } from "../types.js";

/**
 * Feature section: left text (eyebrow, headline, body, CTA) + right image slot.
 * Deterministic, token-driven, perfectly on-brand. This is the highest-volume,
 * most repeatable asset type — the reason templates exist (not image generation).
 */

type ThemeName = "light" | "cream" | "teal" | "ink";

interface ResolvedTheme {
  bg: string;
  text: string;
  textMuted: string;
  eyebrow: string;
  buttonBg: string;
  buttonText: string;
  placeholderFrom: string;
  placeholderTo: string;
  placeholderText: string;
}

function resolveTheme(brand: Brand, name: ThemeName): ResolvedTheme {
  const p = brand.palette;
  switch (name) {
    case "teal":
      return {
        bg: p.teal.base,
        text: "#FFFFFF",
        textMuted: "rgba(255,255,255,0.85)",
        eyebrow: p.teal.tint,
        buttonBg: "#FFFFFF",
        buttonText: p.teal.shade,
        placeholderFrom: p.teal.tint,
        placeholderTo: p.teal.shade,
        placeholderText: "rgba(255,255,255,0.9)",
      };
    case "ink":
      return {
        bg: p.ink.base,
        text: "#FFFFFF",
        textMuted: "rgba(255,255,255,0.78)",
        eyebrow: p.teal.base,
        buttonBg: p.teal.base,
        buttonText: p.ink.shade,
        placeholderFrom: p.teal.shade,
        placeholderTo: p.ink.base,
        placeholderText: "rgba(255,255,255,0.85)",
      };
    case "cream":
      return {
        bg: brand.palette.cream.tint,
        text: p.ink.base,
        textMuted: "rgba(18,21,26,0.72)",
        eyebrow: p.purple.base,
        buttonBg: p.teal.base,
        buttonText: "#FFFFFF",
        placeholderFrom: p.cream.base,
        placeholderTo: p.coral.base,
        placeholderText: "rgba(18,21,26,0.6)",
      };
    case "light":
    default:
      return {
        bg: brand.colors.background,
        text: brand.colors.text,
        textMuted: "rgba(18,21,26,0.7)",
        eyebrow: p.teal.base,
        buttonBg: brand.colors.primary,
        buttonText: "#FFFFFF",
        placeholderFrom: p.teal.tint,
        placeholderTo: p.teal.base,
        placeholderText: "rgba(255,255,255,0.9)",
      };
  }
}

function imageSlot(t: ResolvedTheme, radius: number, imageDataUri: string | null): string {
  if (imageDataUri) {
    return `<img class="hero" src="${imageDataUri}" alt="" style="border-radius:${radius}px" />`;
  }
  // Branded placeholder when no real image/screenshot is supplied yet.
  return `<div class="hero placeholder" style="
      border-radius:${radius}px;
      background:linear-gradient(135deg, ${t.placeholderFrom} 0%, ${t.placeholderTo} 100%);
      color:${t.placeholderText};">
      <span>image slot</span>
    </div>`;
}

export const featureSection: TemplateModule = {
  name: "feature-section",
  description: "Left-text / right-image feature block (eyebrow, headline, body, CTA).",
  defaultSize: { width: 1200, height: 675 },
  requiredFields: ["headline", "body"],

  render(ctx: TemplateContext): string {
    const { brand, content, imageDataUri, fontFaceCSS } = ctx;
    const t = resolveTheme(brand, (content.theme as ThemeName) ?? "light");
    const type = brand.typography;
    const pad = brand.spacing.sectionPadding;

    const eyebrow = content.eyebrow ? esc(content.eyebrow) : "";
    const headline = esc(content.headline);
    const body = esc(content.body);
    const cta = content.cta ? esc(content.cta) : "";
    const wordmark = content.brandMark === false ? "" : esc(brand.brand.name);

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
${fontFaceCSS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%}
body{
  font-family:${fontStack(type.bodyFont)};
  background:${t.bg};
  color:${t.text};
  -webkit-font-smoothing:antialiased;
}
.frame{display:flex;width:100%;height:100%;align-items:stretch}
.col-text{
  flex:1 1 50%;
  display:flex;flex-direction:column;justify-content:center;
  padding:${pad}px;
  gap:${brand.spacing.unit * 3}px;
}
.wordmark{
  font-family:${fontStack(type.headingFont)};
  font-weight:700;font-size:22px;letter-spacing:-0.01em;
  color:${t.text};opacity:0.95;
  position:absolute;top:${pad}px;left:${pad}px;
}
.eyebrow{
  font-family:${fontStack(type.headingFont)};
  text-transform:uppercase;letter-spacing:0.14em;
  font-weight:600;font-size:14px;color:${t.eyebrow};
}
h1{
  font-family:${fontStack(type.headingFont)};
  font-weight:${type.weights?.heading ?? 700};
  font-size:${type.scale.h1}px;line-height:1.04;letter-spacing:-0.02em;
  color:${t.text};max-width:14ch;
}
.body{
  font-size:${type.scale.body}px;line-height:1.5;
  color:${t.textMuted};max-width:46ch;
}
.cta{
  align-self:flex-start;
  margin-top:${brand.spacing.unit}px;
  background:${t.buttonBg};color:${t.buttonText};
  font-family:${fontStack(type.headingFont)};
  font-weight:600;font-size:17px;
  padding:${brand.spacing.unit * 1.75}px ${brand.spacing.unit * 3.5}px;
  border-radius:${brand.radius.button}px;
  text-decoration:none;display:inline-block;
}
.col-image{
  flex:1 1 50%;
  padding:${pad}px ${pad}px ${pad}px 0;
  display:flex;
}
.hero{
  width:100%;height:100%;object-fit:cover;display:block;
}
.placeholder{
  display:flex;align-items:center;justify-content:center;
  font-family:${fontStack(type.headingFont)};
  font-weight:600;font-size:18px;letter-spacing:0.04em;text-transform:uppercase;
}
</style>
</head>
<body>
  ${wordmark ? `<div class="wordmark">${wordmark}</div>` : ""}
  <div class="frame">
    <div class="col-text">
      ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
      <h1>${headline}</h1>
      <p class="body">${body}</p>
      ${cta ? `<a class="cta">${cta}</a>` : ""}
    </div>
    <div class="col-image">
      ${imageSlot(t, brand.radius.card, imageDataUri)}
    </div>
  </div>
</body>
</html>`;
  },
};

export default featureSection;
