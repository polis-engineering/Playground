import "server-only";
import { createClient } from "next-sanity";
import { createMockItems } from "@/lib/gallery/mock";
import type { GalleryItem } from "@/lib/gallery/types";
import { apiVersion, dataset, isSanityConfigured, projectId } from "./env";
import { mapGalleryItems } from "./mapGallery";
import { GALLERY_QUERY } from "./queries";

export type GallerySource = "sanity" | "mock";

export const GALLERY_REVALIDATE_SECONDS = 60;

export async function getGalleryItems(): Promise<{ items: GalleryItem[]; source: GallerySource }> {
  if (!isSanityConfigured) return { items: createMockItems(), source: "mock" };
  try {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: "published",
      token: process.env.SANITY_API_READ_TOKEN,
    });
    const rows = await client.fetch(GALLERY_QUERY, {}, { next: { revalidate: GALLERY_REVALIDATE_SECONDS } });
    return { items: mapGalleryItems(rows as unknown[]), source: "sanity" };
  } catch (error) {
    console.error("[cylinder-gallery] Sanity fetch failed, using mock data", error);
    return { items: createMockItems(), source: "mock" };
  }
}
