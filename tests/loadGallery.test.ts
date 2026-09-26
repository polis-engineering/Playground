import { describe, expect, it } from "vitest";
import { loadGallery } from "@/sanity/loadGallery";

const row = {
  _id: "a",
  title: "A",
  slug: "a",
  media: [{ _key: "m", kind: "image", aspect: "1:1", alt: "", image: { url: "https://cdn.sanity.io/x.jpg" } }],
};

describe("loadGallery", () => {
  it("uses mock data when Sanity is not configured", async () => {
    const out = await loadGallery(false, async () => [row]);
    expect(out.source).toBe("mock");
    expect(out.items).toHaveLength(3);
  });

  it("maps Sanity rows when configured", async () => {
    const out = await loadGallery(true, async () => [row]);
    expect(out.source).toBe("sanity");
    expect(out.items.map((i) => i._id)).toEqual(["a"]);
  });

  it("keeps an empty dataset empty (empty state), not mock", async () => {
    const out = await loadGallery(true, async () => []);
    expect(out).toEqual({ items: [], source: "sanity" });
  });

  it("rethrows fetch errors when configured so ISR keeps the last good page", async () => {
    await expect(loadGallery(true, async () => Promise.reject(new Error("down")))).rejects.toThrow("down");
  });
});
