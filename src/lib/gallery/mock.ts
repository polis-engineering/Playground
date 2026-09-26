import { ASPECTS, type Aspect, type GalleryItem, type MediaAsset } from "./types";

/** Media count per placeholder item, cycled. Covers the spec range 3–8. */
const MEDIA_COUNTS = [5, 3, 8, 4, 6, 7];

/** Figma "alter-start_content-well_960": clip-01 … clip-05 (annex order). */
export const ALTER_START_ASPECTS: readonly Aspect[] = ["16:9", "4:3", "4:3", "4:3", "1:1"];

/** Figma "Media context" placeholder strings. */
const CONTEXT = { label: "Label", description: "Description" };

/** Public CC0 sample clip (MDN). Mock only — real video comes from Mux. */
export const MOCK_VIDEO_SRC = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export type MockOptions = {
  /** Where clip-01.mp4 … clip-05.mp4 live. Unset → the Figma posters are shown as still images. */
  videoBaseUrl?: string;
};

const aspectSlug = (a: Aspect) => a.replace(":", "x");

export function mockMediaUrl(item: number, asset: number, aspect: Aspect) {
  return `/mock-media/${item}/${asset}/${aspectSlug(aspect)}`;
}

function alterStartItem(videoBaseUrl?: string): GalleryItem {
  const media = ALTER_START_ASPECTS.map((aspect, i): MediaAsset => {
    const n = String(i + 1).padStart(2, "0");
    const poster = { url: `/media/alter-start/clip-${n}-poster.webp`, cdn: "static" as const };
    const base = { _key: `alter-start-${n}`, aspect, alt: `Alter Start, clip ${n}`, ...CONTEXT };
    return videoBaseUrl
      ? { ...base, kind: "video", video: { src: `${videoBaseUrl.replace(/\/$/, "")}/clip-${n}.mp4` }, poster }
      : { ...base, kind: "image", image: poster };
  });
  return { _id: "mock-alter-start", title: "Alter Start", slug: "alter-start", media };
}

function placeholderAsset(itemNo: number, assetNo: number, aspect: Aspect, isVideo: boolean): MediaAsset {
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
      ...CONTEXT,
    };
  }
  return { _key, kind: "image", aspect, alt: `Mock item ${itemNo}, image ${assetNo}`, image, ...CONTEXT };
}

function placeholderItem(i: number): GalleryItem {
  const itemNo = i + 1;
  const mediaCount = MEDIA_COUNTS[i % MEDIA_COUNTS.length];
  const media = Array.from({ length: mediaCount }, (_, j) => {
    // Figma pose A: item 2 (below Alter Start) opens on 1:1, item 3 (above) on 4:3.
    const aspect = ASPECTS[(2 * i + j) % ASPECTS.length];
    return placeholderAsset(itemNo, j + 1, aspect, i % 2 === 1 && j === 1);
  });
  const label = String(itemNo).padStart(2, "0");
  return { _id: `mock-item-${label}`, title: `Placeholder ${label}`, slug: `placeholder-${label}`, media };
}

export function createMockItems(count = 3, options: MockOptions = {}): GalleryItem[] {
  const n = Math.max(0, Math.floor(count));
  return Array.from({ length: n }, (_, i) => (i === 0 ? alterStartItem(options.videoBaseUrl) : placeholderItem(i)));
}
