import { ORBIT_GUARDS } from "./defaults";
import type { Slot } from "./types";

export function mod(n: number, m: number) {
  if (m <= 0) return 0;
  return ((n % m) + m) % m;
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function resolveSlotCount(itemCount: number, minVirtualSlots: number) {
  const floor = Number.isFinite(minVirtualSlots) ? Math.floor(minVirtualSlots) : 0;
  return Math.max(itemCount, ORBIT_GUARDS.minSlotsFloor, floor);
}

export function resolveSpacing(opts: { itemCount: number; minVirtualSlots: number; itemAngularSpacing?: number }) {
  const { itemAngularSpacing: s } = opts;
  if (typeof s === "number" && Number.isFinite(s) && s > 0) {
    return clamp(s, ORBIT_GUARDS.spacingMin, ORBIT_GUARDS.spacingMax);
  }
  return (2 * Math.PI) / resolveSlotCount(opts.itemCount, opts.minVirtualSlots);
}

export function resolveFovDeg(fov: "auto" | number) {
  if (fov === "auto" || !Number.isFinite(fov)) return ORBIT_GUARDS.autoFovDeg;
  return clamp(fov, ORBIT_GUARDS.fovMinDeg, ORBIT_GUARDS.fovMaxDeg);
}

/** Camera distance (= CSS perspective) at which the z=0 plane renders 1 world unit per CSS px. */
export function perspectiveDistance(viewportHeight: number, fovDeg: number) {
  return viewportHeight / 2 / Math.tan((fovDeg * Math.PI) / 360);
}

export function tiltMultiplier(spacing: number, tiltDeg?: number) {
  if (typeof tiltDeg !== "number" || !Number.isFinite(tiltDeg) || spacing <= 0) return 1;
  return (tiltDeg * Math.PI) / 180 / spacing;
}

export type PoseOptions = {
  radius: number;
  spacing: number;
  tiltTopMultiplier: number;
  tiltBottomMultiplier: number;
};

/**
 * Pose of a card `offset` slots away from the center (fractional while snapping).
 * Concave drum: the cylinder axis (X) sits in front of the cards at z = +radius, so neighbours curve toward the viewer
 * and tilt to face the center (top card faces down, bottom card faces up). Positive offset = below (next enters from
 * the bottom).
 */
export function slotPose(offset: number, o: PoseOptions) {
  const angle = offset * o.spacing;
  const multiplier = angle < 0 ? o.tiltTopMultiplier : o.tiltBottomMultiplier;
  return {
    angle,
    y: -o.radius * Math.sin(angle),
    z: o.radius - o.radius * Math.cos(angle),
    rotationX: -angle * multiplier,
  };
}

type PeekArgs = {
  viewportHeight: number;
  cardHeight: number;
  spacing: number;
  perspective: number;
  tiltMultiplier: number;
};

/** Visible fraction (0–1) of the +1 neighbour's projected height inside the viewport. */
export function neighborVisibleFraction(a: PeekArgs & { radius: number }) {
  const pose = slotPose(1, {
    radius: a.radius,
    spacing: a.spacing,
    tiltTopMultiplier: a.tiltMultiplier,
    tiltBottomMultiplier: a.tiltMultiplier,
  });
  const half = a.cardHeight / 2;
  const project = (y: number, z: number) => (a.perspective - z > 0 ? (y * a.perspective) / (a.perspective - z) : -Infinity);
  const near = project(pose.y + half * Math.cos(pose.rotationX), pose.z + half * Math.sin(pose.rotationX));
  const far = project(pose.y - half * Math.cos(pose.rotationX), pose.z - half * Math.sin(pose.rotationX));
  const height = near - far;
  if (!(height > 0)) return 0;
  return clamp((near + a.viewportHeight / 2) / height, 0, 1);
}

function neighborPose(a: PeekArgs & { radius: number }) {
  return slotPose(1, {
    radius: a.radius,
    spacing: a.spacing,
    tiltTopMultiplier: a.tiltMultiplier,
    tiltBottomMultiplier: a.tiltMultiplier,
  });
}

/** Card normal (after rotation.x = φ: (0, −sin φ, cos φ)) · vector to the camera. Linear in radius. */
function neighborFacingDot(a: PeekArgs & { radius: number }) {
  const pose = neighborPose(a);
  return -Math.sin(pose.rotationX) * -pose.y + Math.cos(pose.rotationX) * (a.perspective - pose.z);
}

/** True when the +1 neighbour's front face points at the camera (not edge-on / back-facing). */
export function neighborFacesCamera(a: PeekArgs & { radius: number }) {
  return neighborFacingDot(a) > 0;
}

/** z of the +1 neighbour's point closest to the camera. */
export function neighborNearestZ(a: PeekArgs & { radius: number }) {
  const pose = neighborPose(a);
  return pose.z + (a.cardHeight / 2) * Math.abs(Math.sin(pose.rotationX));
}

/** Largest radius at which a quantity linear in radius stays below `limit` (Infinity when it never reaches it). */
function linearRadiusLimit(at: (radius: number) => number, limit: number) {
  const base = at(0);
  const slope = at(1) - base;
  if (base >= limit) return 0;
  if (slope <= 0) return Infinity;
  return (limit - base) / slope;
}

/** Radius range where the neighbour faces the camera and stays in front of the near plane. */
function radiusSearchCeiling(a: PeekArgs) {
  const facing = linearRadiusLimit((radius) => -neighborFacingDot({ ...a, radius }), 0);
  const near = linearRadiusLimit(
    (radius) => neighborNearestZ({ ...a, radius }),
    a.perspective * ORBIT_GUARDS.nearPlaneFraction,
  );
  return Math.min(a.viewportHeight * ORBIT_GUARDS.solverMaxRadiusFactor, facing * (1 - 1e-4), near);
}

export type RadiusSolution = { radius: number; achieved: number; reachable: boolean };

/**
 * Radius whose neighbour peek equals `peekRatio`, searched only where the neighbour faces the camera (wide FOVs or
 * large spacings turn it edge-on inside the viewport, which makes the peek discontinuous). Scans for the first
 * crossing, then bisects. When no radius reaches the target, returns the closest one with `reachable: false`.
 */
export function solveAutoRadiusDetailed(a: PeekArgs & { peekRatio: number }): RadiusSolution {
  if (!(a.viewportHeight > 0) || !(a.cardHeight > 0) || !(a.perspective > 0) || !(a.spacing > 0)) {
    return { radius: 0, achieved: 0, reachable: false };
  }
  const target = clamp(a.peekRatio, ORBIT_GUARDS.peekRatioMin, ORBIT_GUARDS.peekRatioMax);
  const fraction = (radius: number) => neighborVisibleFraction({ ...a, radius });
  const hi = radiusSearchCeiling(a);
  const n = ORBIT_GUARDS.solverSamples;

  let best = 0;
  let prevR = 0;
  let prevF = fraction(0);
  for (let i = 1; i <= n && hi > 0; i++) {
    const r = hi * (i / n) ** 4;
    const f = fraction(r);
    if (prevF > target && f <= target) {
      let lo = prevR;
      let up = r;
      for (let k = 0; k < ORBIT_GUARDS.solverIterations; k++) {
        const mid = (lo + up) / 2;
        if (fraction(mid) > target) lo = mid;
        else up = mid;
      }
      best = (lo + up) / 2;
      break;
    }
    // Ties go to the larger radius so an unreachable peek never stacks neighbours on the center card (R → 0).
    if (Math.abs(f - target) <= Math.abs(fraction(best) - target)) best = r;
    prevR = r;
    prevF = f;
  }
  // Not covering the center card outranks the exact peek (magnified concave neighbours at wide FOVs).
  if (fraction(best) > 0 && !neighborClearsCenter({ ...a, radius: best })) {
    best = firstClearingRadius(a, best, hi) ?? best;
  }
  let achieved = fraction(best);
  const reachable =
    Math.abs(achieved - target) < ORBIT_GUARDS.peekTolerance && neighborClearsCenter({ ...a, radius: best });
  if (!reachable && achieved > 0 && !neighborClearsCenter({ ...a, radius: best })) {
    // Last resort: push neighbours out of view (off-screen or past the near plane, where orbitScene hides them).
    best = a.viewportHeight * ORBIT_GUARDS.solverMaxRadiusFactor;
    achieved = fraction(best);
  }
  return { radius: best, achieved, reachable };
}

function firstClearingRadius(a: PeekArgs, from: number, hi: number) {
  const clears = (radius: number) => neighborClearsCenter({ ...a, radius });
  const n = ORBIT_GUARDS.solverSamples;
  let prev = from;
  for (let i = 1; i <= n; i++) {
    const r = from + (hi - from) * (i / n);
    if (clears(r)) {
      let lo = prev;
      let up = r;
      for (let k = 0; k < ORBIT_GUARDS.solverIterations; k++) {
        const mid = (lo + up) / 2;
        if (clears(mid)) up = mid;
        else lo = mid;
      }
      return up;
    }
    prev = r;
  }
  return null;
}

/** True when the +1 neighbour's near edge projects below the center card (no overlap). */
export function neighborClearsCenter(a: PeekArgs & { radius: number }) {
  const pose = slotPose(1, {
    radius: a.radius,
    spacing: a.spacing,
    tiltTopMultiplier: a.tiltMultiplier,
    tiltBottomMultiplier: a.tiltMultiplier,
  });
  const half = a.cardHeight / 2;
  const z = pose.z + half * Math.sin(pose.rotationX);
  if (a.perspective - z <= 0) return false;
  const nearY = ((pose.y + half * Math.cos(pose.rotationX)) * a.perspective) / (a.perspective - z);
  return nearY < -half;
}

export function solveAutoRadius(a: PeekArgs & { peekRatio: number }) {
  return solveAutoRadiusDetailed(a).radius;
}

export type OrbitLayoutInput = {
  width: number;
  height: number;
  cardHeight: number;
  itemCount: number;
  peekRatio: number;
  radius: number | "auto";
  minVirtualSlots: number;
  perspectiveFov: "auto" | number;
  itemAngularSpacing?: number;
  tiltTopDeg?: number;
  tiltBottomDeg?: number;
};

export type OrbitLayout = PoseOptions & {
  width: number;
  height: number;
  cardHeight: number;
  fovDeg: number;
  perspective: number;
  /** Neighbour peek actually produced by this layout (0–1). */
  peekAchieved: number;
  /** False when `peekRatio` cannot be reached with this FOV / spacing / tilt (or an explicit radius misses it). */
  peekReachable: boolean;
};

export function computeOrbitLayout(i: OrbitLayoutInput): OrbitLayout {
  const spacing = resolveSpacing(i);
  const fovDeg = resolveFovDeg(i.perspectiveFov);
  const perspective = perspectiveDistance(i.height, fovDeg);
  const tiltTopMultiplier = tiltMultiplier(spacing, i.tiltTopDeg);
  const tiltBottomMultiplier = tiltMultiplier(spacing, i.tiltBottomDeg);
  const peekArgs = {
    viewportHeight: i.height,
    cardHeight: i.cardHeight,
    spacing,
    perspective,
    tiltMultiplier: tiltBottomMultiplier,
  };
  let radius: number;
  let peekAchieved: number;
  let peekReachable: boolean;
  if (typeof i.radius === "number" && Number.isFinite(i.radius)) {
    radius = Math.max(0, i.radius);
    peekAchieved = neighborVisibleFraction({ ...peekArgs, radius });
    peekReachable = Math.abs(peekAchieved - i.peekRatio) < ORBIT_GUARDS.peekTolerance;
  } else {
    const solved = solveAutoRadiusDetailed({ ...peekArgs, peekRatio: i.peekRatio });
    radius = solved.radius;
    peekAchieved = solved.achieved;
    peekReachable = solved.reachable;
  }
  return {
    width: i.width,
    height: i.height,
    cardHeight: i.cardHeight,
    fovDeg,
    perspective,
    radius,
    spacing,
    tiltTopMultiplier,
    tiltBottomMultiplier,
    peekAchieved,
    peekReachable,
  };
}

export function clampPosition(pos: number, itemCount: number, loop: boolean) {
  if (loop) return pos;
  return clamp(pos, 0, Math.max(0, itemCount - 1));
}

export function resolveInitialSlot(initialIndex: number, itemCount: number, loop: boolean) {
  const start = Number.isFinite(initialIndex) ? Math.round(initialIndex) : 0;
  return loop ? start : clamp(start, 0, Math.max(0, itemCount - 1));
}

/** DOM slots around `base`; without loop, slots outside the list are dropped (no wrapped neighbours). */
export function visibleSlots(base: number, window: number, itemCount: number, loop: boolean) {
  if (itemCount <= 0) return [];
  const slots = windowSlots(base, window);
  return loop ? slots : slots.filter((s) => s >= 0 && s < itemCount);
}

export function windowSlots(base: number, window: number) {
  return Array.from({ length: window * 2 + 1 }, (_, i) => base - window + i);
}

export function slotForOffset(offset: number): Slot {
  if (offset === 0) return "center";
  if (offset === -1) return "top";
  if (offset === 1) return "bottom";
  return "hidden";
}
