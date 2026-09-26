import { describe, expect, it } from "vitest";
import { ALTER_START_ASPECTS, createMockItems } from "@/lib/gallery/mock";

describe("createMockItems", () => {
  it("starts with 3 items by default", () => {
    expect(createMockItems()).toHaveLength(3);
  });

  it("leads with the Figma 'Alter Start' clips in annex order", () => {
    const [first] = createMockItems();
    expect(first.media.map((m) => m.aspect)).toEqual([...ALTER_START_ASPECTS]);
    expect(first.media[0].image?.url ?? first.media[0].poster?.url).toBe("/media/alter-start/clip-01-poster.webp");
  });

  it("uses posters as images until clip videos are provided", () => {
    const [first] = createMockItems();
    expect(first.media.every((m) => m.kind === "image")).toBe(true);
  });

  it("switches the Alter Start clips to looping videos when a video base URL is given", () => {
    const [first] = createMockItems(3, { videoBaseUrl: "https://cdn.example.com/alter-start" });
    expect(first.media[1]).toMatchObject({
      kind: "video",
      video: { src: "https://cdn.example.com/alter-start/clip-02.mp4" },
      poster: { url: "/media/alter-start/clip-02-poster.webp" },
    });
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

  it("carries the Figma Media context placeholders", () => {
    const m = createMockItems()[0].media[0];
    expect(m.label).toBe("Label");
    expect(m.description).toBe("Description");
  });

  it("clamps count to at least 0", () => {
    expect(createMockItems(-2)).toHaveLength(0);
  });
});
