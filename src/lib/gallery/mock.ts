import { ASPECTS, type Aspect, type GalleryItem, type MediaAsset } from "./types";

/** Media count per mock item, cycled. Covers the spec range 3–8. */
const MEDIA_COUNTS = [5, 3, 8, 4, 6, 7];

/** Public CC0 sample clip (MDN). Mock only — real video comes from Mux. */
export const MOCK_VIDEO_SRC = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const aspectSlug = (a: Aspect) => a.replace(":", "x");

export function mockMediaUrl(item: number, asset: number, aspect: Aspect) {
  return `/mock-media/${item}/${asset}/${aspectSlug(aspect)}`;
}

function mockAsset(itemNo: number, assetNo: number, aspect: Aspect, isVideo: boolean): MediaAsset {
  const _key = `mock-${itemNo}-${assetNo}`;
  const image = { url: mockMediaUrl(itemNo, assetNo, aspect), cdn: "static" as const };
  if (isVideo) {
    return {
      _key,
      kind: "video",
      aspect: "16:9",
      alt: `Mock item ${itemNo}, video ${assetNo}`,
      video: { src: MOCK_VIDEO_SRC },
      poster: { url: mockMediaUrl(itemNo, assetNo, "16:9"), cdn: "static" },
    };
  }
  return { _key, kind: "image", aspect, alt: `Mock item ${itemNo}, image ${assetNo}`, image };
}

export function createMockItems(count = 3): GalleryItem[] {
  const n = Math.max(0, Math.floor(count));
  return Array.from({ length: n }, (_, i) => {
    const itemNo = i + 1;
    const mediaCount = MEDIA_COUNTS[i % MEDIA_COUNTS.length];
    const media = Array.from({ length: mediaCount }, (_, j) => {
      const aspect = ASPECTS[(i + j) % ASPECTS.length];
      const isVideo = i % 2 === 1 && j === 1;
      return mockAsset(itemNo, j + 1, aspect, isVideo);
    });
    const label = String(itemNo).padStart(2, "0");
    return { _id: `mock-item-${label}`, title: `Placeholder ${label}`, slug: `placeholder-${label}`, media };
  });
}
