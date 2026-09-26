import { describe, expect, it, vi } from "vitest";
import { mapGalleryItems } from "@/sanity/mapGallery";

const img = (w: number, h: number) => ({
  url: `https://cdn.sanity.io/images/p/d/abc-${w}x${h}.jpg`,
  width: w,
  height: h,
  lqip: "data:image/jpeg;base64,xx",
});

describe("mapGalleryItems", () => {
  it("maps GROQ rows to gallery items", () => {
    const [item] = mapGalleryItems([
      {
        _id: "a",
        title: "Alpha",
        slug: "alpha",
        media: [
          { _key: "m1", kind: "image", aspect: "4:3", alt: "one", image: img(1200, 900) },
          { _key: "m2", kind: "video", aspect: "16:9", alt: "two", playbackId: "pb1", poster: img(1600, 900) },
        ],
      },
    ]);

    expect(item).toEqual({
      _id: "a",
      title: "Alpha",
      slug: "alpha",
      media: [
        {
          _key: "m1",
          kind: "image",
          aspect: "4:3",
          alt: "one",
          image: { ...img(1200, 900), cdn: "sanity" },
        },
        {
          _key: "m2",
          kind: "video",
          aspect: "16:9",
          alt: "two",
          video: { playbackId: "pb1" },
          poster: { ...img(1600, 900), cdn: "sanity" },
        },
      ],
    });
  });

  it("drops media rows missing their required source", () => {
    const [item] = mapGalleryItems([
      {
        _id: "a",
        title: "A",
        slug: "a",
        media: [
          { _key: "ok", kind: "image", aspect: "1:1", alt: "", image: img(10, 10) },
          { _key: "noimg", kind: "image", aspect: "1:1", alt: "" },
          { _key: "novid", kind: "video", aspect: "1:1", alt: "", playbackId: null },
        ],
      },
    ]);
    expect(item.media.map((m) => m._key)).toEqual(["ok"]);
  });

  it("falls back to 16:9 for invalid aspect and logs", () => {
    const log = vi.fn();
    const [item] = mapGalleryItems(
      [{ _id: "a", title: "A", slug: "a", media: [{ _key: "m", kind: "image", aspect: "3:2", alt: "", image: img(3, 2) }] }],
      log,
    );
    expect(item.media[0].aspect).toBe("16:9");
    expect(log).toHaveBeenCalled();
  });

  it("drops items that end up with no media", () => {
    expect(mapGalleryItems([{ _id: "a", title: "A", slug: "a", media: [] }], () => {})).toEqual([]);
  });

  it("tolerates non-array input", () => {
    expect(mapGalleryItems(null as unknown as unknown[])).toEqual([]);
  });
});
