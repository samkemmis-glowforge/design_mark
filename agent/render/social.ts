/**
 * Social-graphic canvas presets + safe-area helpers. FB/IG formats compose
 * differently per shape and must respect platform chrome, so each preset
 * carries its own margin/safe-zone rather than rescaling one layout.
 */
import { makeGrid } from "./layout.js";

export type SocialFormat = "ig-square" | "ig-portrait" | "story" | "fb-link";

export interface SocialPreset {
  w: number;
  h: number;
  margin: number;
  /** Keep key content (text, logo) inside this inset on every edge. */
  safe: { top: number; right: number; bottom: number; left: number };
  note: string;
}

export const SOCIAL: Record<SocialFormat, SocialPreset> = {
  // Feed post: no heavy platform overlay; just keep a comfortable margin and
  // remember it renders small on mobile (legibility > density).
  "ig-square": {
    w: 1080, h: 1080, margin: 72,
    safe: { top: 72, right: 72, bottom: 72, left: 72 },
    note: "IG/FB feed square",
  },
  "ig-portrait": {
    w: 1080, h: 1350, margin: 80,
    safe: { top: 80, right: 80, bottom: 80, left: 80 },
    note: "IG portrait (max feed real estate)",
  },
  // Story/Reel: top ~250px (profile/close) and bottom ~250px (caption/CTA) are
  // covered by UI — keep all content in the middle band.
  story: {
    w: 1080, h: 1920, margin: 80,
    safe: { top: 250, right: 80, bottom: 320, left: 80 },
    note: "Story/Reel (UI-safe middle band)",
  },
  "fb-link": {
    w: 1200, h: 630, margin: 64,
    safe: { top: 64, right: 64, bottom: 64, left: 64 },
    note: "FB link/share card",
  },
};

export function socialGrid(format: SocialFormat, cols = 12) {
  const p = SOCIAL[format];
  return makeGrid({ width: p.w, height: p.h, margin: p.margin, cols });
}
