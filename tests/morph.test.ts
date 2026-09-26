import { describe, expect, it } from "vitest";
import { handoffBoxes } from "@/lib/gallery/morph";

// Figma "alter-start_content-well_960": full media box 819.2 × 460.8, keyframes from get_motion_context.
const W = 819.2;
const H = 460.8;
const INSET = 405.8 / 460.8;

describe("handoffBoxes (annex: compress into the next clip, hard cut, spring out)", () => {
  it("16:9 → 4:3 hands off at the 4:3 inset width, each keeping its own aspect", () => {
    const { from, to } = handoffBoxes(W, H, "16:9", "4:3", INSET);
    expect(from.width).toBeCloseTo(540.8, 0);
    expect(from.height).toBeCloseTo(304.4, 0);
    expect(to.width).toBeCloseTo(540.8, 0);
    expect(to.height).toBeCloseTo(406.04, 0);
  });

  it("4:3 → 4:3 compresses to the same inset box", () => {
    const { from, to } = handoffBoxes(W, H, "4:3", "4:3", INSET);
    expect(from).toEqual(to);
    expect(from.width).toBeCloseTo(540.8, 0);
  });

  it("4:3 → 1:1 hands off at the square inset width", () => {
    const { from, to } = handoffBoxes(W, H, "4:3", "1:1", INSET);
    expect(from.width).toBeCloseTo(405.8, 0);
    expect(from.height).toBeCloseTo(304.68, 0);
    expect(to).toEqual({ width: from.width, height: from.width });
  });

  it("1:1 → 16:9 (loop) enters wide media at the square inset width", () => {
    const { to } = handoffBoxes(W, H, "1:1", "16:9", INSET);
    expect(to.width).toBeCloseTo(405.8, 0);
    expect(to.height).toBeCloseTo(228.42, 0);
  });

  it("returns zero boxes for an unmeasured shell", () => {
    expect(handoffBoxes(0, 0, "1:1", "4:3", INSET).from).toEqual({ width: 0, height: 0 });
  });
});
