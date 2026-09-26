import { describe, expect, it } from "vitest";
import { cardTokensToVars, expandTokensToVars, imageSources, withDefaults } from "@/lib/gallery/props";

describe("withDefaults", () => {
  it("fills missing and undefined keys from defaults", () => {
    expect(withDefaults({ a: 1, b: 2 }, { b: undefined })).toEqual({ a: 1, b: 2 });
  });

  it("keeps explicit falsy overrides", () => {
    expect(withDefaults({ a: 1, loop: true }, { a: 0, loop: false })).toEqual({ a: 0, loop: false });
  });

  it("tolerates missing overrides", () => {
    expect(withDefaults({ a: 1 })).toEqual({ a: 1 });
  });
});

describe("cardTokensToVars", () => {
  it("maps tokens to CSS custom properties", () => {
    expect(cardTokensToVars({ width: "300px", height: "200px", borderRadius: "8px", background: "red" })).toEqual({
      "--cg-card-width": "300px",
      "--cg-card-height": "200px",
      "--cg-card-radius": "8px",
      "--cg-card-bg": "red",
    });
  });

  it("skips undefined tokens and tilt (not CSS)", () => {
    expect(cardTokensToVars({ padding: undefined, tiltTopDeg: 10 })).toEqual({});
  });
});

describe("expandTokensToVars", () => {
  it("maps expand tokens to CSS custom properties", () => {
    expect(expandTokensToVars({ inset: "10px", borderRadius: "4px", background: "#000" })).toEqual({
      "--cg-expand-inset": "10px",
      "--cg-expand-radius": "4px",
      "--cg-expand-bg": "#000",
    });
  });
});

describe("imageSources", () => {
  it("builds a sized srcset for Sanity CDN images", () => {
    const out = imageSources({ url: "https://cdn.sanity.io/images/p/d/a-10x10.jpg", cdn: "sanity" }, [400, 800]);
    expect(out.src).toBe("https://cdn.sanity.io/images/p/d/a-10x10.jpg?w=800&auto=format&fit=max");
    expect(out.srcSet).toBe(
      "https://cdn.sanity.io/images/p/d/a-10x10.jpg?w=400&auto=format&fit=max 400w, https://cdn.sanity.io/images/p/d/a-10x10.jpg?w=800&auto=format&fit=max 800w",
    );
  });

  it("uses static URLs as-is", () => {
    expect(imageSources({ url: "/mock-media/1/1/16x9", cdn: "static" }, [400])).toEqual({ src: "/mock-media/1/1/16x9" });
  });
});
