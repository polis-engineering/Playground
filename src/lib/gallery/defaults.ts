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
  radius: "auto" as const,
  /** `undefined` = derived: 2π / max(N, minVirtualSlots). Radians. */
  itemAngularSpacing: undefined as number | undefined,
  minVirtualSlots: 12,
  /** "auto" = `ORBIT_GUARDS.autoFovDeg`. Number = vertical FOV in degrees (Three.js PerspectiveCamera). */
  perspectiveFov: "auto" as const,
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
  /** [IMPL] vertical FOV used when perspectiveFov = "auto". */
  autoFovDeg: 30,
  fovMinDeg: 1,
  fovMaxDeg: 170,
  /** [IMPL] peekRatio is clamped into this range. */
  peekRatioMin: 0,
  peekRatioMax: 0.9,
  /** [IMPL] DOM cards rendered either side of the center slot. */
  renderWindow: 2,
  /** [IMPL] radius solver iterations (binary search). */
  solverIterations: 60,
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

export const CARD_DEFAULTS = {
  /** [OPEN §12.4] token values per breakpoint. Defaults keep a 4:3 shell that fits 3 slots at any viewport. */
  width: "min(86vw, calc(48dvh * 4 / 3))",
  height: "min(48dvh, calc(86vw * 3 / 4))",
  borderRadius: "20px",
  padding: "0px",
  background: "#161618",
  shadow: "0 30px 80px rgba(0, 0, 0, 0.45)",
  /** `undefined` = derived from orbit. Degrees at the ±1 slot; applied as a multiplier of the orbit angle. */
  tiltTopDeg: undefined as number | undefined,
  tiltBottomDeg: undefined as number | undefined,
};

export const MEDIA_DEFAULTS = {
  /** [FACT] */
  intervalMs: 3500,
  /** [ASSUMPTION] duration/ease from spec; fromScale is [IMPL]. */
  bounce: { duration: 0.45, ease: "back.out(1.7)", fromScale: 0.94 },
  /** [IMPL] GSAP Flip on the absolutely positioned media frame — outer shell never changes. */
  aspectMorph: { duration: 0.45, ease: "power3.inOut" },
  /** [ASSUMPTION §10] media error → fallback, then skip to next asset after this delay. */
  mediaErrorSkipMs: 1200,
};

export const EXPAND_DEFAULTS = {
  /** [ASSUMPTION] */
  flipDurationMs: 500,
  /** [IMPL] */
  flipEase: "power3.inOut",
  /** [FACT] only option. */
  scroll: "vertical" as const,
  /** [FACT] phase-1 body copy. */
  placeholder: "Soon, check back later",
};
