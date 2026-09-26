import { describe, expect, it } from "vitest";
import { createStepper, normalizeWheelDelta } from "@/lib/gallery/stepper";

const opts = { wheelStepThreshold: 40, wheelIdleResetMs: 180, swipeMinDistancePx: 40, swipeMinVelocity: 0.35, tapSlopPx: 8 };

describe("wheel", () => {
  it("accumulates below threshold without stepping", () => {
    const s = createStepper(opts);
    expect(s.wheel(15, 0, 0, false)).toBe(0);
    expect(s.wheel(15, 0, 10, false)).toBe(0);
  });

  it("steps +1 (next) when scrolling down past threshold", () => {
    const s = createStepper(opts);
    s.wheel(25, 0, 0, false);
    expect(s.wheel(25, 0, 10, false)).toBe(1);
  });

  it("steps -1 (previous) when scrolling up", () => {
    const s = createStepper(opts);
    expect(s.wheel(-60, 0, 0, false)).toBe(-1);
  });

  it("ignores trailing momentum until an idle gap", () => {
    const s = createStepper(opts);
    expect(s.wheel(60, 0, 0, false)).toBe(1);
    expect(s.wheel(60, 0, 50, false)).toBe(0);
    expect(s.wheel(60, 0, 200, false)).toBe(0);
    expect(s.wheel(60, 0, 200 + 181, false)).toBe(1);
  });

  it("ignores input while busy (snapping or locked)", () => {
    const s = createStepper(opts);
    expect(s.wheel(100, 0, 0, true)).toBe(0);
    expect(s.wheel(10, 0, 10, false)).toBe(0);
  });

  it("ignores horizontal-dominant wheel", () => {
    const s = createStepper(opts);
    expect(s.wheel(50, 120, 0, false)).toBe(0);
  });
});

describe("normalizeWheelDelta", () => {
  it("passes pixels through", () => {
    expect(normalizeWheelDelta(12, 0, 800)).toBe(12);
  });

  it("converts lines and pages to pixels", () => {
    expect(normalizeWheelDelta(3, 1, 800)).toBe(48);
    expect(normalizeWheelDelta(1, 2, 800)).toBe(800);
  });
});

describe("swipe", () => {
  it("finger up = next (content moves toward top)", () => {
    expect(createStepper(opts).swipe(-60, 0, 300, false)).toBe(1);
  });

  it("finger down = previous", () => {
    expect(createStepper(opts).swipe(60, 0, 300, false)).toBe(-1);
  });

  it("ignores short slow drags", () => {
    expect(createStepper(opts).swipe(-20, 0, 300, false)).toBe(0);
  });

  it("accepts short fast flicks beyond tap slop", () => {
    expect(createStepper(opts).swipe(-25, 0, 40, false)).toBe(1);
  });

  it("ignores horizontal-dominant swipes", () => {
    expect(createStepper(opts).swipe(-60, 120, 300, false)).toBe(0);
  });

  it("ignores swipes while busy", () => {
    expect(createStepper(opts).swipe(-60, 0, 300, true)).toBe(0);
  });
});
