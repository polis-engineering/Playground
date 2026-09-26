import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, isSanityConfigured, projectId } from "./env";
import { loadGallery } from "./loadGallery";
import { GALLERY_QUERY } from "./queries";

export type { GallerySource } from "./loadGallery";

export const GALLERY_REVALIDATE_SECONDS = 60;

export function getGalleryItems() {
  return loadGallery(isSanityConfigured, async () => {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: "published",
      token: process.env.SANITY_API_READ_TOKEN,
    });
    const rows = await client.fetch(GALLERY_QUERY, {}, { next: { revalidate: GALLERY_REVALIDATE_SECONDS } });
    return rows as unknown[];
  });
}
