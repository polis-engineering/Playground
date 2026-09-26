import type { EaseValue } from "./easing";

/**
 * Every layout / 3D / timing default lives here (spec §5: "no silent magic numbers").
 * Tags: [FACT] locked by spec v0.2, [ASSUMPTION] spec default until contradicted,
 * [IMPL] implementation knob not named in the spec — exposed as a prop so it is never silent.
 */

export const CYLINDER_DEFAULTS = {
  initialIndex: 0,
  /** [FACT] locked. */
  visibleCount: 3 as const,
  /** Fraction of the top/bottom card's projected height left visible. */
  peekRatio: 0.33,
  /** "auto" solves the radius from viewport height so the peek equals `peekRatio`. */
  radius: "auto" as number | "auto",
  /** `undefined` = derived: 2π / max(N, minVirtualSlots). Radians. */
  itemAngularSpacing: undefined as number | undefined,
  minVirtualSlots: 12,
  /** "auto" = `ORBIT_GUARDS.autoFovDeg`. Number = vertical FOV in degrees (Three.js PerspectiveCamera). */
  perspectiveFov: "auto" as "auto" | number,
  /** [ASSUMPTION] matches s.page feel. */
  snapDurationMs: 620,
  snapEase: "power4.out",
  loop: true,
  locked: false,
};

export const ORBIT_GUARDS = {
  /** [IMPL] α ≤ 72° so the ±1 neighbours always face forward, whatever minVirtualSlots says. */
  minSlotsFloor: 5,
  /** [IMPL] spacing overrides are clamped into (0, 90°). */
  spacingMin: 0.01,
  spacingMax: Math.PI / 2 - 0.01,
  /** [IMPL] vertical FOV used when perspectiveFov = "auto". 27° reproduces the Figma frame (neighbour ≈ 496px tall at 1512×982). */
  autoFovDeg: 27,
  fovMinDeg: 1,
  fovMaxDeg: 170,
  /** [IMPL] peekRatio is clamped into this range. */
  peekRatioMin: 0,
  peekRatioMax: 0.9,
  /** [IMPL] DOM cards rendered either side of the center slot. */
  renderWindow: 2,
  /** [IMPL] concave orbit: cards whose nearest point passes this fraction of the camera distance are hidden. */
  nearPlaneFraction: 0.8,
  /** [IMPL] radius solver: scan samples, bisection iterations, search ceiling (× viewport height), peek tolerance. */
  solverSamples: 256,
  solverIterations: 60,
  solverMaxRadiusFactor: 1000,
  peekTolerance: 0.005,
};

export const GESTURE_DEFAULTS = {
  /** [IMPL] accumulated wheel px that triggers one step. */
  wheelStepThreshold: 40,
  /** [IMPL] quiet gap that re-arms the wheel after a step (swallows trackpad momentum). */
  wheelIdleResetMs: 180,
  /** [IMPL] vertical swipe distance that triggers one step. */
  swipeMinDistancePx: 40,
  /** [IMPL] or: vertical flick velocity (px/ms) beyond tap slop. */
  swipeMinVelocity: 0.35,
  /** [IMPL] movement below this is a tap (click); above it, the click is suppressed. */
  tapSlopPx: 8,
};

/** [IMPL] px per line for `WheelEvent.deltaMode === DOM_DELTA_LINE` (Firefox mouse wheels). */
export const WHEEL_LINE_HEIGHT_PX = 16;

export const CARD_DEFAULTS = {
  /**
   * Slot = the media's maximum (16:9) box. Figma desktop (1512×982): 819.2 × 460.8, i.e. 46.93dvh tall.
   * Narrower aspects (4:3, 1:1) use the full height. [OPEN §12.4] mobile values (no mobile frame yet).
   */
  width: "min(calc(46.93dvh * 16 / 9), 86vw)",
  height: "min(46.93dvh, calc(86vw * 9 / 16))",
  /** Figma radius/4xl — applied to the visible placeholder (media box). */
  borderRadius: "var(--radius-4xl)",
  padding: "0px",
  /** Placeholder fill under the media. Transparent: only the media has content. */
  background: "transparent",
  /** Figma Content well effect (drop shadow 0 16 48 / 35%). */
  shadow: "var(--shadow-content-well)",
  /** `undefined` = derived from orbit. Degrees at the ±1 slot; applied as a multiplier of the orbit angle. */
  tiltTopDeg: undefined as number | undefined,
  tiltBottomDeg: undefined as number | undefined,
};

export const MEDIA_DEFAULTS = {
  /** [FACT] */
  intervalMs: 3500,
  /**
   * Entrance (annex + Figma motion context): the incoming clip springs from the handoff box to full size.
   * Spring = 1 − e^(−t·decay)(cos(t·frequency) + ratio·sin(t·frequency)), bounce ≈ 0.35.
   */
  bounce: { duration: 0.4, spring: { decay: 7.5258, frequency: 8.7987, ratio: 0.8553 } },
  /**
   * Exit (annex + Figma): the outgoing clip compresses (own aspect) during the last `duration` of the interval,
   * then a hard opacity cut. insetScale = 405.8 / 460.8 from the Figma keyframes.
   */
  aspectMorph: { duration: 0.15, ease: [0.5, 0, 1, 1] as EaseValue, insetScale: 405.8 / 460.8 },
  /** [ASSUMPTION §10] media error → fallback, then skip to next asset after this delay. */
  mediaErrorSkipMs: 1200,
  /** [IMPL] visible fraction of the gallery below which it counts as "off-viewport" and pauses (spec §6). */
  viewportPauseThreshold: 0.25,
  /** [IMPL] Sanity CDN srcset widths and `sizes` hint (spec §11.9: CDN + sized URLs). */
  imageWidths: [480, 800, 1200, 1600, 2000],
  imageSizes: "(max-width: 768px) 90vw, 50vw",
};

export const EXPAND_DEFAULTS = {
  /** Open: the placeholder grows from the card. Emil pass: modal range, strong drawer ease-out (was 500ms). */
  flipDurationMs: 400,
  flipEase: [0.32, 0.72, 0, 1] as EaseValue,
  /** Close: exits faster than it enters; on-screen morph → ease-in-out. */
  closeDurationMs: 300,
  closeEase: [0.77, 0, 0.175, 1] as EaseValue,
  /** Media fades + blurs out as the placeholder scales up (blur masks the crossfade), back in as it lands. */
  mediaHideMs: 200,
  mediaHideBlurPx: 10,
  /** Copy + close button reveal after the flip. */
  copyRevealMs: 200,
  copyOffsetPx: 8,
  copyHideMs: 120,
  /** Cylinder fade: out fast on open, back in during the close. */
  cylinderFadeOutMs: 200,
  cylinderFadeInMs: 300,
  /** [FACT] only option. */
  scroll: "vertical" as const,
  /** [FACT] phase-1 body copy. */
  placeholder: "Soon, check back later",
  /** [OPEN §12.4] expanded placeholder geometry — design pending. Fill stays transparent like the card. */
  inset: "max(12px, 3dvh) max(12px, 3vw)",
  borderRadius: "var(--radius-4xl)",
  background: "transparent",
};
