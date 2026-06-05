/** Channel/size presets so a brief like "LinkedIn" or "blog hero" sets dimensions automatically. */

export interface Preset {
  label: string;
  width: number;
  height: number;
}

export const PRESETS: Record<string, Preset> = {
  "blog-hero": { label: "Blog hero", width: 1200, height: 675 },
  "linkedin-feed": { label: "LinkedIn feed", width: 1200, height: 627 },
  "twitter-card": { label: "X/Twitter card", width: 1600, height: 900 },
  "og-image": { label: "Open Graph / link preview", width: 1200, height: 630 },
  "email-banner": { label: "Email banner", width: 1200, height: 400 },
  "ig-square": { label: "Instagram square", width: 1080, height: 1080 },
  "ig-portrait": { label: "Instagram portrait", width: 1080, height: 1350 },
  "ig-story": { label: "Instagram/TikTok story", width: 1080, height: 1920 },
};

export function resolvePreset(name: string | undefined): Preset | null {
  if (!name) return null;
  return PRESETS[name] ?? null;
}

/** One-line catalog for the system prompt / tool description. */
export function presetCatalog(): string {
  return Object.entries(PRESETS)
    .map(([k, p]) => `${k} (${p.width}×${p.height})`)
    .join(", ");
}
