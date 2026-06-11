/**
 * Layout relationships for render scripts — compose with intent, not magic
 * pixels. The two failure classes this kills:
 *
 *  1. Off-center subjects: crops are computed FROM a recorded subject box
 *     (assets/magic-engraver/subjects.json pattern: normalized face/focal
 *     boxes, verified visually once) instead of hand-tuned offsets.
 *  2. Arbitrary spacing: a simple column grid + margin tokens shared by all
 *     scripts, so edges align by construction.
 */

export interface SubjectBox {
  /** Normalized 0–1 coordinates of the focal region (e.g. the face). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ImageInfo {
  w: number;
  h: number;
  subject: SubjectBox;
}

export interface CoverCrop {
  /** CSS pixel values for an <img> inside an overflow:hidden frame. */
  width: number;
  height: number;
  left: number;
  top: number;
  /** Scale applied to the source image (display px per source px). */
  scale: number;
  /** Where the subject's center ended up, in frame coordinates. */
  subjectCenter: { x: number; y: number };
  /** Displayed size of the subject box. */
  subjectSize: { w: number; h: number };
}

/**
 * Position an image inside a frame so the subject box is centered and its
 * larger dimension fills `fill` of the frame (default 0.72). The image always
 * covers the frame (no gaps); if the subject sits near an image edge, the
 * offset is clamped and `subjectCenter` reports the true resulting position
 * so callers can assert on it.
 */
export function coverCrop(
  img: ImageInfo,
  frame: { w: number; h: number },
  fill = 0.72,
): CoverCrop {
  const sw = img.subject.w * img.w;
  const sh = img.subject.h * img.h;

  let scale = fill * Math.min(frame.w / sw, frame.h / sh);
  scale = Math.max(scale, frame.w / img.w, frame.h / img.h); // must cover

  const width = img.w * scale;
  const height = img.h * scale;
  const cx = (img.subject.x + img.subject.w / 2) * width;
  const cy = (img.subject.y + img.subject.h / 2) * height;

  const left = clamp(frame.w / 2 - cx, frame.w - width, 0);
  const top = clamp(frame.h / 2 - cy, frame.h - height, 0);

  return {
    width, height, left, top, scale,
    subjectCenter: { x: cx + left, y: cy + top },
    subjectSize: { w: sw * scale, h: sh * scale },
  };
}

/** CSS for an absolutely-positioned <img> from a CoverCrop. */
export function cropCss(c: CoverCrop): string {
  return `position:absolute;left:${c.left.toFixed(1)}px;top:${c.top.toFixed(1)}px;` +
    `width:${c.width.toFixed(1)}px;height:${c.height.toFixed(1)}px`;
}

/**
 * Place an overlay of aspect `overlayAspect` (h/w) centered on the cropped
 * subject — e.g. compositing an engraving onto a detected coaster face.
 * `rel` = overlay width as a fraction of the displayed subject width;
 * `dy` = vertical offset as a fraction of displayed subject height.
 */
export function overlayOnSubject(
  c: CoverCrop,
  overlayAspect: number,
  rel = 0.6,
  dy = 0,
): { left: number; top: number; width: number; height: number } {
  const width = c.subjectSize.w * rel;
  const height = width * overlayAspect;
  return {
    width,
    height,
    left: c.subjectCenter.x - width / 2,
    top: c.subjectCenter.y - height / 2 + dy * c.subjectSize.h,
  };
}

/** Simple column grid with shared margin/gutter tokens. */
export function makeGrid(opts?: {
  width?: number;
  height?: number;
  margin?: number;
  cols?: number;
  gutter?: number;
}) {
  const width = opts?.width ?? 1920;
  const height = opts?.height ?? 1080;
  const margin = opts?.margin ?? 84;
  const cols = opts?.cols ?? 12;
  const gutter = opts?.gutter ?? 24;
  const colW = (width - 2 * margin - (cols - 1) * gutter) / cols;
  return {
    width, height, margin, cols, gutter, colW,
    /** Left edge of column i (0-based). */
    x: (i: number) => margin + i * (colW + gutter),
    /** Width spanning n columns starting at column i. */
    span: (n: number) => n * colW + (n - 1) * gutter,
    /** x for an element of width w aligned to the right margin. */
    right: (w: number) => width - margin - w,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}
