import { parseAspect } from "@/lib/gallery/aspect";
import type { GalleryItem, MediaAsset, MediaImage } from "@/lib/gallery/types";

type RawImage = { url?: string | null; width?: number | null; height?: number | null; lqip?: string | null } | null;

type RawMedia = {
  _key?: string;
  kind?: string;
  aspect?: string;
  alt?: string | null;
  image?: RawImage;
  playbackId?: string | null;
  poster?: RawImage;
};

type RawItem = { _id?: string; title?: string | null; slug?: string | null; media?: RawMedia[] | null };

const defaultLog = (msg: string) => console.warn(msg);

function mapImage(raw: RawImage | undefined): MediaImage | undefined {
  if (!raw?.url) return undefined;
  const out: MediaImage = { url: raw.url, cdn: "sanity" };
  if (raw.width) out.width = raw.width;
  if (raw.height) out.height = raw.height;
  if (raw.lqip) out.lqip = raw.lqip;
  return out;
}

function mapMedia(raw: RawMedia, log: (msg: string) => void): MediaAsset | null {
  if (!raw?._key) return null;
  const aspect = parseAspect(raw.aspect, log);
  const alt = raw.alt ?? "";
  if (raw.kind === "video") {
    if (!raw.playbackId) return null;
    const asset: MediaAsset = { _key: raw._key, kind: "video", aspect, alt, video: { playbackId: raw.playbackId } };
    const poster = mapImage(raw.poster);
    if (poster) asset.poster = poster;
    return asset;
  }
  const image = mapImage(raw.image);
  if (!image) return null;
  return { _key: raw._key, kind: "image", aspect, alt, image };
}

export function mapGalleryItems(rows: unknown[], log: (msg: string) => void = defaultLog): GalleryItem[] {
  if (!Array.isArray(rows)) return [];
  const items: GalleryItem[] = [];
  for (const row of rows as RawItem[]) {
    if (!row?._id) continue;
    const media = (row.media ?? []).map((m) => mapMedia(m, log)).filter((m): m is MediaAsset => m !== null);
    if (media.length === 0) continue;
    items.push({ _id: row._id, title: row.title ?? "", slug: row.slug ?? row._id, media });
  }
  return items;
}
