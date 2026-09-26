import type { CSSProperties } from "react";
import type { EaseValue, SpringConfig } from "./easing";
import type { MediaImage } from "./types";

/** §5 GalleryItemCard CSS tokens + tilt overrides. */
export type CardTokens = {
  width?: string;
  height?: string;
  borderRadius?: string;
  padding?: string;
  background?: string;
  shadow?: string;
  tiltTopDeg?: number;
  tiltBottomDeg?: number;
};

/** Entrance spring (seconds). */
export type BounceConfig = { duration: number; spring: SpringConfig };
/** Exit compress before the hard cut (seconds) + handoff inset. */
export type AspectMorphConfig = { duration: number; ease: EaseValue; insetScale: number };

export type ExpandTokens = {
  inset?: string;
  borderRadius?: string;
  background?: string;
};

export function withDefaults<T extends object>(defaults: T, overrides?: Partial<T>): T {
  const out = { ...defaults };
  if (!overrides) return out;
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const value = overrides[key];
    if (value !== undefined) out[key] = value as T[keyof T];
  }
  return out;
}

function toVars(map: Record<string, string>, source: object) {
  const vars: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(map)) {
    const value = (source as Record<string, unknown>)[key];
    if (typeof value === "string") vars[cssVar] = value;
  }
  return vars as CSSProperties;
}

const CARD_VARS: Record<string, string> = {
  width: "--cg-card-width",
  height: "--cg-card-height",
  borderRadius: "--cg-card-radius",
  padding: "--cg-card-padding",
  background: "--cg-card-bg",
  shadow: "--cg-card-shadow",
};

const EXPAND_VARS: Record<string, string> = {
  inset: "--cg-expand-inset",
  borderRadius: "--cg-expand-radius",
  background: "--cg-expand-bg",
};

export const cardTokensToVars = (tokens: CardTokens) => toVars(CARD_VARS, tokens);
export const expandTokensToVars = (tokens: ExpandTokens) => toVars(EXPAND_VARS, tokens);

export function imageSources(image: MediaImage, widths: number[]) {
  if (image.cdn !== "sanity" || widths.length === 0) return { src: image.url };
  const sized = (w: number) => `${image.url}?w=${w}&auto=format&fit=max`;
  return {
    src: sized(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${sized(w)} ${w}w`).join(", "),
  };
}
