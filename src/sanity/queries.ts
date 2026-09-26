import { defineQuery } from "next-sanity";

/** Ordering is `_createdAt asc`: spec §8 defines no order field ([OPEN]). */
export const GALLERY_QUERY = defineQuery(`*[_type == "galleryItem" && defined(slug.current)] | order(_createdAt asc) {
  _id,
  title,
  "slug": slug.current,
  media[]{
    _key,
    kind,
    aspect,
    alt,
    "image": image{ "url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height, "lqip": asset->metadata.lqip },
    "playbackId": video.asset->playbackId,
    "poster": poster{ "url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height, "lqip": asset->metadata.lqip }
  }
}`);
