import { describe, expect, it } from "vitest";
import { ORBIT_GUARDS } from "@/lib/gallery/defaults";
import {
  clampPosition,
  computeOrbitLayout,
  mod,
  neighborClearsCenter,
  neighborFacesCamera,
  neighborVisibleFraction,
  resolveInitialSlot,
  solveAutoRadiusDetailed,
  visibleSlots,
  perspectiveDistance,
  resolveFovDeg,
  resolveSlotCount,
  resolveSpacing,
  slotForOffset,
  slotPose,
  solveAutoRadius,
  tiltMultiplier,
  windowSlots,
} from "@/lib/gallery/orbit";

describe("mod", () => {
  it("wraps negative and overflowing indexes", () => {
    expect(mod(-1, 3)).toBe(2);
    expect(mod(4, 3)).toBe(1);
    expect(mod(-7, 3)).toBe(2);
  });

  it("returns 0 for an empty list", () => {
    expect(mod(5, 0)).toBe(0);
  });
});

describe("resolveSlotCount", () => {
  it("pads short lists up to minVirtualSlots", () => {
    expect(resolveSlotCount(3, 12)).toBe(12);
  });

  it("uses item count when it exceeds minVirtualSlots", () => {
    expect(resolveSlotCount(40, 12)).toBe(40);
  });

  it("never drops below the front-facing floor", () => {
    expect(resolveSlotCount(3, 2)).toBe(ORBIT_GUARDS.minSlotsFloor);
    expect(resolveSlotCount(1, Number.NaN)).toBe(ORBIT_GUARDS.minSlotsFloor);
  });
});

describe("resolveSpacing", () => {
  it("derives 2π / max(N, minVirtualSlots)", () => {
    expect(resolveSpacing({ itemCount: 3, minVirtualSlots: 12 })).toBeCloseTo((2 * Math.PI) / 12);
  });

  it("honours an explicit spacing", () => {
    expect(resolveSpacing({ itemCount: 3, minVirtualSlots: 12, itemAngularSpacing: 0.4 })).toBe(0.4);
  });

  it("clamps explicit spacing below 90°", () => {
    expect(resolveSpacing({ itemCount: 3, minVirtualSlots: 12, itemAngularSpacing: 3 })).toBe(
      ORBIT_GUARDS.spacingMax,
    );
  });

  it("ignores invalid explicit spacing", () => {
    expect(resolveSpacing({ itemCount: 3, minVirtualSlots: 12, itemAngularSpacing: -1 })).toBeCloseTo(
      (2 * Math.PI) / 12,
    );
  });
});

describe("resolveFovDeg / perspectiveDistance", () => {
  it("maps auto to the documented default", () => {
    expect(resolveFovDeg("auto")).toBe(ORBIT_GUARDS.autoFovDeg);
  });

  it("clamps numeric fov", () => {
    expect(resolveFovDeg(45)).toBe(45);
    expect(resolveFovDeg(0)).toBe(ORBIT_GUARDS.fovMinDeg);
    expect(resolveFovDeg(500)).toBe(ORBIT_GUARDS.fovMaxDeg);
  });

  it("places the camera so z=0 renders 1:1", () => {
    expect(perspectiveDistance(1000, 90)).toBeCloseTo(500);
  });
});

describe("tiltMultiplier", () => {
  it("is 1 when derived from the orbit", () => {
    expect(tiltMultiplier(Math.PI / 6)).toBe(1);
  });

  it("converts an explicit tilt at the ±1 slot to a multiplier", () => {
    expect(tiltMultiplier(Math.PI / 6, 15)).toBeCloseTo(0.5);
  });
});

describe("slotPose", () => {
  const opts = { radius: 1000, spacing: Math.PI / 6, tiltTopMultiplier: 1, tiltBottomMultiplier: 1 };

  it("puts the center card face-on at the origin", () => {
    const p = slotPose(0, opts);
    expect(p.y).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(0);
    expect(p.rotationX).toBeCloseTo(0);
  });

  it("puts the next item below and behind (it enters from the bottom)", () => {
    const p = slotPose(1, opts);
    expect(p.y).toBeLessThan(0);
    expect(p.z).toBeLessThan(0);
    expect(p.rotationX).toBeCloseTo(Math.PI / 6);
  });

  it("puts the previous item above", () => {
    const p = slotPose(-1, opts);
    expect(p.y).toBeGreaterThan(0);
    expect(p.rotationX).toBeCloseTo(-Math.PI / 6);
  });

  it("applies separate top/bottom tilt multipliers", () => {
    const p = slotPose(-1, { ...opts, tiltTopMultiplier: 0.5 });
    expect(p.rotationX).toBeCloseTo(-Math.PI / 12);
    expect(slotPose(1, { ...opts, tiltBottomMultiplier: 2 }).rotationX).toBeCloseTo(Math.PI / 3);
  });
});

describe("solveAutoRadius", () => {
  const cases = [];
  for (const viewportHeight of [852, 982, 1200]) {
    for (const cardRatio of [0.4, 0.5]) {
      for (const itemCount of [3, 12, 40]) {
        for (const peekRatio of [0.2, 0.33, 0.5]) {
          cases.push({ viewportHeight, cardRatio, itemCount, peekRatio });
        }
      }
    }
  }

  it.each(cases)("hits peekRatio for %o", ({ viewportHeight, cardRatio, itemCount, peekRatio }) => {
    const spacing = resolveSpacing({ itemCount, minVirtualSlots: 12 });
    const perspective = perspectiveDistance(viewportHeight, resolveFovDeg("auto"));
    const args = { viewportHeight, cardHeight: viewportHeight * cardRatio, spacing, perspective, tiltMultiplier: 1 };
    const radius = solveAutoRadius({ ...args, peekRatio });
    expect(radius).toBeGreaterThan(0);
    expect(neighborVisibleFraction({ ...args, radius })).toBeCloseTo(peekRatio, 2);
  });

  it("keeps a gap between center and neighbour at default proportions", () => {
    const viewportHeight = 982;
    const cardHeight = viewportHeight * 0.48;
    const spacing = resolveSpacing({ itemCount: 3, minVirtualSlots: 12 });
    const perspective = perspectiveDistance(viewportHeight, resolveFovDeg("auto"));
    const radius = solveAutoRadius({ viewportHeight, cardHeight, spacing, perspective, peekRatio: 0.33, tiltMultiplier: 1 });
    const pose = slotPose(1, { radius, spacing, tiltTopMultiplier: 1, tiltBottomMultiplier: 1 });
    const topEdgeY = pose.y + (cardHeight / 2) * Math.cos(pose.rotationX);
    const topEdgeZ = pose.z + (cardHeight / 2) * Math.sin(pose.rotationX);
    const screenY = (topEdgeY * perspective) / (perspective - topEdgeZ);
    expect(screenY).toBeLessThan(-cardHeight / 2);
  });

  it("returns a finite non-negative radius for degenerate input", () => {
    const r = solveAutoRadius({
      viewportHeight: 0,
      cardHeight: 0,
      spacing: 0.5,
      perspective: 0,
      peekRatio: 0.33,
      tiltMultiplier: 1,
    });
    expect(Number.isFinite(r)).toBe(true);
    expect(r).toBeGreaterThanOrEqual(0);
  });
});

describe("solveAutoRadiusDetailed across FOV × minVirtualSlots", () => {
  type GridCase = { viewportWidth: number; viewportHeight: number; fov: number; minVirtualSlots: number; peekRatio: number };
  const grid: GridCase[] = [];
  for (const [viewportWidth, viewportHeight] of [
    [1512, 982],
    [393, 852],
  ]) {
    for (let fov = 10; fov <= 170; fov += 20) {
      for (const minVirtualSlots of [5, 8, 12, 24]) {
        for (const peekRatio of [0.1, 0.33, 0.5]) {
          grid.push({ viewportWidth, viewportHeight, fov, minVirtualSlots, peekRatio });
        }
      }
    }
  }

  const argsFor = (g: GridCase) => {
    const spacing = resolveSpacing({ itemCount: 3, minVirtualSlots: g.minVirtualSlots });
    return {
      viewportHeight: g.viewportHeight,
      cardHeight: g.viewportHeight * 0.48,
      spacing,
      perspective: perspectiveDistance(g.viewportHeight, resolveFovDeg(g.fov)),
      tiltMultiplier: 1,
    };
  };

  it.each(grid)("never shows a back-facing or center-covering neighbour for %o", (g) => {
    const a = argsFor(g);
    const out = solveAutoRadiusDetailed({ ...a, peekRatio: g.peekRatio });
    if (out.achieved > 0) {
      expect(neighborFacesCamera({ ...a, radius: out.radius })).toBe(true);
      expect(neighborClearsCenter({ ...a, radius: out.radius })).toBe(true);
    }
  });

  it.each(grid)("hits peekRatio when reachable, else reports it for %o", (g) => {
    const a = argsFor(g);
    const out = solveAutoRadiusDetailed({ ...a, peekRatio: g.peekRatio });
    expect(out.achieved).toBeCloseTo(neighborVisibleFraction({ ...a, radius: out.radius }), 6);
    if (out.reachable) expect(Math.abs(out.achieved - g.peekRatio)).toBeLessThan(0.005);
    else expect(Math.abs(out.achieved - g.peekRatio)).toBeGreaterThanOrEqual(0.005);
  });

  it("is reachable at defaults", () => {
    const out = solveAutoRadiusDetailed({
      ...argsFor({ viewportWidth: 1512, viewportHeight: 982, fov: 30, minVirtualSlots: 12, peekRatio: 0.33 }),
      peekRatio: 0.33,
    });
    expect(out.reachable).toBe(true);
  });

  it.each([50, 70, 90])("keeps the fallback neighbour off the center card when unreachable (FOV %i°, 5 slots)", (fov) => {
    const a = argsFor({ viewportWidth: 1512, viewportHeight: 982, fov, minVirtualSlots: 5, peekRatio: 0.33 });
    const out = solveAutoRadiusDetailed({ ...a, peekRatio: 0.33 });
    expect(out.reachable).toBe(false);
    const hidden = out.achieved === 0;
    expect(hidden || neighborClearsCenter({ ...a, radius: out.radius })).toBe(true);
  });

  it("no longer lands on the back-facing discontinuity (FOV 90°, 8 slots, 393×852)", () => {
    const a = argsFor({ viewportWidth: 393, viewportHeight: 852, fov: 90, minVirtualSlots: 8, peekRatio: 0.33 });
    const out = solveAutoRadiusDetailed({ ...a, peekRatio: 0.33 });
    expect(out.achieved).toBeGreaterThan(0);
  });
});

describe("computeOrbitLayout", () => {
  const base = {
    width: 1512,
    height: 982,
    cardHeight: 452,
    itemCount: 3,
    peekRatio: 0.33,
    radius: "auto" as const,
    minVirtualSlots: 12,
    perspectiveFov: "auto" as const,
  };

  it("solves the radius when radius is auto", () => {
    const l = computeOrbitLayout(base);
    expect(l.radius).toBeGreaterThan(0);
    expect(
      neighborVisibleFraction({
        viewportHeight: l.height,
        cardHeight: base.cardHeight,
        spacing: l.spacing,
        perspective: l.perspective,
        tiltMultiplier: 1,
        radius: l.radius,
      }),
    ).toBeCloseTo(0.33, 2);
  });

  it("uses an explicit radius as-is", () => {
    expect(computeOrbitLayout({ ...base, radius: 1234 }).radius).toBe(1234);
  });

  it("reports the achieved peek and whether peekRatio was reached", () => {
    const ok = computeOrbitLayout(base);
    expect(ok.peekReachable).toBe(true);
    expect(ok.peekAchieved).toBeCloseTo(0.33, 2);
    const wide = computeOrbitLayout({ ...base, perspectiveFov: 150, minVirtualSlots: 5 });
    expect(wide.peekReachable).toBe(false);
  });

  it("guards negative explicit radius", () => {
    expect(computeOrbitLayout({ ...base, radius: -5 }).radius).toBe(0);
  });

  it("derives tilt multipliers from tilt degrees", () => {
    const l = computeOrbitLayout({ ...base, tiltTopDeg: 15, tiltBottomDeg: 60 });
    expect(l.tiltTopMultiplier).toBeCloseTo(0.5);
    expect(l.tiltBottomMultiplier).toBeCloseTo(2);
  });

  it("reports the camera distance matching fov", () => {
    const l = computeOrbitLayout({ ...base, perspectiveFov: 90 });
    expect(l.perspective).toBeCloseTo(491);
    expect(l.fovDeg).toBe(90);
  });
});

describe("clampPosition", () => {
  it("leaves position untouched when looping", () => {
    expect(clampPosition(-4, 3, true)).toBe(-4);
  });

  it("clamps to the list when not looping", () => {
    expect(clampPosition(5.5, 3, false)).toBe(2);
    expect(clampPosition(-1, 3, false)).toBe(0);
  });
});

describe("visibleSlots", () => {
  it("keeps wrapped neighbours when looping", () => {
    expect(visibleSlots(0, 2, 3, true)).toEqual([-2, -1, 0, 1, 2]);
  });

  it("drops slots outside the list when not looping", () => {
    expect(visibleSlots(0, 2, 3, false)).toEqual([0, 1, 2]);
    expect(visibleSlots(2, 2, 3, false)).toEqual([0, 1, 2]);
    expect(visibleSlots(4, 2, 10, false)).toEqual([2, 3, 4, 5, 6]);
  });

  it("is empty for an empty list", () => {
    expect(visibleSlots(0, 2, 0, true)).toEqual([]);
  });
});

describe("resolveInitialSlot", () => {
  it("keeps the raw slot when looping (item = mod)", () => {
    expect(resolveInitialSlot(4, 3, true)).toBe(4);
    expect(resolveInitialSlot(-1.4, 3, true)).toBe(-1);
  });

  it("clamps when not looping", () => {
    expect(resolveInitialSlot(4, 3, false)).toBe(2);
    expect(resolveInitialSlot(-1, 3, false)).toBe(0);
  });

  it("treats non-finite as 0", () => {
    expect(resolveInitialSlot(Number.NaN, 3, true)).toBe(0);
  });
});

describe("windowSlots / slotForOffset", () => {
  it("renders base ± window slots", () => {
    expect(windowSlots(7, 2)).toEqual([5, 6, 7, 8, 9]);
  });

  it("labels offsets", () => {
    expect(slotForOffset(0)).toBe("center");
    expect(slotForOffset(-1)).toBe("top");
    expect(slotForOffset(1)).toBe("bottom");
    expect(slotForOffset(2)).toBe("hidden");
  });
});
