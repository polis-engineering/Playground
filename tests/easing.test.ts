import { describe, expect, it } from "vitest";
import { cubicBezier, springEase, toGsapEase } from "@/lib/gallery/easing";

describe("toGsapEase", () => {
  it("passes GSAP ease strings through", () => {
    expect(toGsapEase("power4.out")).toBe("power4.out");
  });

  it("turns a bezier tuple into an ease function", () => {
    const e = toGsapEase([0.5, 0, 1, 1]);
    expect(typeof e).toBe("function");
    expect((e as (t: number) => number)(0.5)).toBeCloseTo(cubicBezier(0.5, 0, 1, 1)(0.5), 10);
  });
});

const FIGMA_SPRING = { decay: 7.5258, frequency: 8.7987, ratio: 0.8553 };

describe("springEase (Figma entrance spring)", () => {
  const ease = springEase(FIGMA_SPRING);

  it("starts at 0 and settles at 1", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBeCloseTo(1, 3);
  });

  it("matches the Figma formula mid-way", () => {
    const t = 0.3;
    const expected = 1 - Math.exp(-t * 7.5258) * (Math.cos(t * 8.7987) + 0.8553 * Math.sin(t * 8.7987));
    expect(ease(t)).toBeCloseTo(expected, 10);
  });

  it("overshoots (moderate bounce)", () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => ease(i / 100)));
    expect(peak).toBeGreaterThan(1.02);
    expect(peak).toBeLessThan(1.15);
  });

  it("clamps outside [0, 1]", () => {
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
  });
});

describe("cubicBezier", () => {
  it("is the identity for a linear curve", () => {
    const linear = cubicBezier(0, 0, 1, 1);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) expect(linear(t)).toBeCloseTo(t, 5);
  });

  it("matches CSS `ease` at the midpoint", () => {
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 3);
  });

  it("accelerates for the annex exit curve (.5, 0, 1, 1)", () => {
    const exit = cubicBezier(0.5, 0, 1, 1);
    expect(exit(0)).toBe(0);
    expect(exit(1)).toBe(1);
    expect(exit(0.5)).toBeLessThan(0.5);
  });

  it("is monotonic for monotonic control points", () => {
    const e = cubicBezier(0.23, 1, 0.32, 1);
    let prev = -1;
    for (let i = 0; i <= 50; i++) {
      const v = e(i / 50);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });
});
