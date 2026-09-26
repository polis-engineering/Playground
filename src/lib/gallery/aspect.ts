import { ASPECTS, type Aspect } from "./types";

export const FALLBACK_ASPECT: Aspect = "16:9";

const RATIOS: Record<Aspect, number> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
};

const defaultLog = (msg: string) => console.warn(msg);

export function parseAspect(value: unknown, log: (msg: string) => void = defaultLog): Aspect {
  if (typeof value === "string" && (ASPECTS as readonly string[]).includes(value)) {
    return value as Aspect;
  }
  log(`[cylinder-gallery] invalid aspect "${String(value)}", falling back to ${FALLBACK_ASPECT}`);
  return FALLBACK_ASPECT;
}

export function aspectRatio(aspect: Aspect): number {
  return RATIOS[aspect];
}

/** Studio validation hint only — the editorial `aspect` field stays the source of truth. */
export function nearestAspect(width: number, height: number): Aspect | null {
  if (!(width > 0) || !(height > 0)) return null;
  const ratio = width / height;
  let best: Aspect = ASPECTS[0];
  for (const a of ASPECTS) {
    if (Math.abs(RATIOS[a] - ratio) < Math.abs(RATIOS[best] - ratio)) best = a;
  }
  return best;
}

/** Sanity image refs encode dimensions: `image-<hash>-<w>x<h>-<ext>`. */
export function dimensionsFromImageRef(ref: string | undefined | null) {
  const match = /^image-[^-]+-(\d+)x(\d+)-\w+$/.exec(ref ?? "");
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

/** Largest box of `aspect` that fits inside the fixed shell (contain). */
export function fitAspect(shellWidth: number, shellHeight: number, aspect: Aspect) {
  if (shellWidth <= 0 || shellHeight <= 0) return { width: 0, height: 0 };
  const ratio = RATIOS[aspect];
  let width = shellWidth;
  let height = width / ratio;
  if (height > shellHeight) {
    height = shellHeight;
    width = height * ratio;
  }
  return { width: Math.round(width), height: Math.round(height) };
}
