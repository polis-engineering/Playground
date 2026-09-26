import { describe, expect, it, vi } from "vitest";
import { aspectRatio, fitAspect, parseAspect } from "@/lib/gallery/aspect";

describe("parseAspect", () => {
  it("accepts the three supported aspects", () => {
    expect(parseAspect("16:9")).toBe("16:9");
    expect(parseAspect("4:3")).toBe("4:3");
    expect(parseAspect("1:1")).toBe("1:1");
  });

  it("falls back to 16:9 and logs once for unknown values", () => {
    const log = vi.fn();
    expect(parseAspect("21:9", log)).toBe("16:9");
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toContain("21:9");
  });

  it("falls back to 16:9 for missing values", () => {
    expect(parseAspect(undefined, () => {})).toBe("16:9");
  });
});

describe("aspectRatio", () => {
  it("returns width / height", () => {
    expect(aspectRatio("16:9")).toBeCloseTo(16 / 9);
    expect(aspectRatio("4:3")).toBeCloseTo(4 / 3);
    expect(aspectRatio("1:1")).toBe(1);
  });
});

describe("fitAspect", () => {
  it("letterboxes wide media inside a square shell", () => {
    expect(fitAspect(400, 400, "16:9")).toEqual({ width: 400, height: 225 });
  });

  it("pillarboxes square media inside a wide shell", () => {
    expect(fitAspect(800, 450, "1:1")).toEqual({ width: 450, height: 450 });
  });

  it("fills a shell of the same aspect", () => {
    expect(fitAspect(800, 600, "4:3")).toEqual({ width: 800, height: 600 });
  });

  it("never exceeds the shell", () => {
    for (const a of ["16:9", "4:3", "1:1"] as const) {
      const box = fitAspect(333, 517, a);
      expect(box.width).toBeLessThanOrEqual(333);
      expect(box.height).toBeLessThanOrEqual(517);
    }
  });

  it("returns zero box for an unmeasured shell", () => {
    expect(fitAspect(0, 0, "1:1")).toEqual({ width: 0, height: 0 });
  });
});
