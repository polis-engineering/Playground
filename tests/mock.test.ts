import { describe, expect, it } from "vitest";
import { createMockItems } from "@/lib/gallery/mock";

describe("createMockItems", () => {
  it("starts with 3 items by default", () => {
    expect(createMockItems()).toHaveLength(3);
  });

  it("gives every item 3 to 8 media assets", () => {
    for (const item of createMockItems(12)) {
      expect(item.media.length).toBeGreaterThanOrEqual(3);
      expect(item.media.length).toBeLessThanOrEqual(8);
    }
  });

  it("uses unique ids and media keys", () => {
    const items = createMockItems(12);
    expect(new Set(items.map((i) => i._id)).size).toBe(12);
    const keys = items.flatMap((i) => i.media.map((m) => m._key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every video a poster", () => {
    const videos = createMockItems(12).flatMap((i) => i.media.filter((m) => m.kind === "video"));
    expect(videos.length).toBeGreaterThan(0);
    for (const v of videos) expect(v.poster?.url).toBeTruthy();
  });

  it("exercises all three aspects in the first item", () => {
    const aspects = new Set(createMockItems()[0].media.map((m) => m.aspect));
    expect(aspects).toEqual(new Set(["16:9", "4:3", "1:1"]));
  });

  it("clamps count to at least 0", () => {
    expect(createMockItems(-2)).toHaveLength(0);
  });
});
