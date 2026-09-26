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
 * Cylinder axis = X, center of the cylinder at z = -radius, positive offset = below (next item enters from bottom).
 */
export function slotPose(offset: number, o: PoseOptions) {
  const angle = offset * o.spacing;
  const multiplier = angle < 0 ? o.tiltTopMultiplier : o.tiltBottomMultiplier;
  return {
    angle,
    y: -o.radius * Math.sin(angle),
    z: o.radius * Math.cos(angle) - o.radius,
    rotationX: angle * multiplier,
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

/** Binary search for the radius whose neighbour peek equals `peekRatio`. Monotonic in radius. */
export function solveAutoRadius(a: PeekArgs & { peekRatio: number }) {
  if (!(a.viewportHeight > 0) || !(a.cardHeight > 0) || !(a.perspective > 0) || !(a.spacing > 0)) return 0;
  const target = clamp(a.peekRatio, ORBIT_GUARDS.peekRatioMin, ORBIT_GUARDS.peekRatioMax);
  let lo = 0;
  let hi = a.viewportHeight * 1000;
  for (let i = 0; i < ORBIT_GUARDS.solverIterations; i++) {
    const mid = (lo + hi) / 2;
    if (neighborVisibleFraction({ ...a, radius: mid }) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
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
  fovDeg: number;
  perspective: number;
};

export function computeOrbitLayout(i: OrbitLayoutInput): OrbitLayout {
  const spacing = resolveSpacing(i);
  const fovDeg = resolveFovDeg(i.perspectiveFov);
  const perspective = perspectiveDistance(i.height, fovDeg);
  const tiltTopMultiplier = tiltMultiplier(spacing, i.tiltTopDeg);
  const tiltBottomMultiplier = tiltMultiplier(spacing, i.tiltBottomDeg);
  const radius =
    typeof i.radius === "number" && Number.isFinite(i.radius)
      ? Math.max(0, i.radius)
      : solveAutoRadius({
          viewportHeight: i.height,
          cardHeight: i.cardHeight,
          spacing,
          perspective,
          peekRatio: i.peekRatio,
          tiltMultiplier: tiltBottomMultiplier,
        });
  return { width: i.width, height: i.height, fovDeg, perspective, radius, spacing, tiltTopMultiplier, tiltBottomMultiplier };
}

export function clampPosition(pos: number, itemCount: number, loop: boolean) {
  if (loop) return pos;
  return clamp(pos, 0, Math.max(0, itemCount - 1));
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
