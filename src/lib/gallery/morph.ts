import { aspectRatio } from "./aspect";
import type { Aspect } from "./types";

export type Box = { width: number; height: number };

/** Unrounded contain-fit of `aspect` in the shell (GSAP tweens want sub-pixel values). */
export function fullBox(shellWidth: number, shellHeight: number, aspect: Aspect): Box {
  if (!(shellWidth > 0) || !(shellHeight > 0)) return { width: 0, height: 0 };
  const width = Math.min(shellWidth, shellHeight * aspectRatio(aspect));
  return { width, height: width / aspectRatio(aspect) };
}

/**
 * Annex / Figma media choreography: the outgoing clip compresses (own aspect) to a handoff width, the incoming clip
 * appears at that same width in its own aspect and springs out. Handoff width = insetScale × the narrower of the two
 * full widths, so the hard cut never jumps horizontally.
 */
export function handoffBoxes(shellWidth: number, shellHeight: number, from: Aspect, to: Aspect, insetScale: number) {
  const width = insetScale * Math.min(fullBox(shellWidth, shellHeight, from).width, fullBox(shellWidth, shellHeight, to).width);
  const box = (a: Aspect): Box => (width > 0 ? { width, height: width / aspectRatio(a) } : { width: 0, height: 0 });
  return { from: box(from), to: box(to) };
}
