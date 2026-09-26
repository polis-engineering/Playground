import { describe, expect, it } from "vitest";
import { dimensionsFromImageRef, nearestAspect } from "@/lib/gallery/aspect";
import { renderMockSvg } from "@/lib/gallery/mockSvg";

describe("nearestAspect", () => {
  it("maps dimensions to the closest supported aspect", () => {
    expect(nearestAspect(1920, 1080)).toBe("16:9");
    expect(nearestAspect(1024, 768)).toBe("4:3");
    expect(nearestAspect(800, 810)).toBe("1:1");
  });

  it("returns null for unusable dimensions", () => {
    expect(nearestAspect(0, 100)).toBeNull();
  });
});

describe("dimensionsFromImageRef", () => {
  it("parses Sanity image asset refs", () => {
    expect(dimensionsFromImageRef("image-abc123-1920x1080-jpg")).toEqual({ width: 1920, height: 1080 });
  });

  it("returns null for non-image refs", () => {
    expect(dimensionsFromImageRef("file-abc-pdf")).toBeNull();
    expect(dimensionsFromImageRef(undefined)).toBeNull();
  });
});

describe("renderMockSvg", () => {
  it("renders an SVG sized to the aspect with a label", () => {
    const svg = renderMockSvg(1, 2, "4:3");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 0 1200 900"');
    expect(svg).toContain("4:3");
  });
});
