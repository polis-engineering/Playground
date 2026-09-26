export const ASPECTS = ["16:9", "4:3", "1:1"] as const;
export type Aspect = (typeof ASPECTS)[number];

export type MediaImage = {
  url: string;
  width?: number;
  height?: number;
  lqip?: string;
  /** `sanity` URLs get CDN sizing params (`?w=…&auto=format`); `static` URLs are used as-is. */
  cdn: "sanity" | "static";
};

export type MediaVideo = {
  /** Mux public playback id (Sanity + sanity-plugin-mux-input). */
  playbackId?: string;
  /** Direct file URL. Mock data only. */
  src?: string;
};

export type MediaAsset = {
  _key: string;
  kind: "image" | "video";
  aspect: Aspect;
  alt: string;
  image?: MediaImage;
  video?: MediaVideo;
  poster?: MediaImage;
  /** Figma "Media context" tag (glass pill, bottom-right of the card). */
  label?: string;
  description?: string;
};

export type GalleryItem = {
  _id: string;
  title: string;
  slug: string;
  media: MediaAsset[];
};

export type Slot = "top" | "center" | "bottom" | "hidden";
