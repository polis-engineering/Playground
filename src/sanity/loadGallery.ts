import { createMockItems } from "@/lib/gallery/mock";
import type { GalleryItem } from "@/lib/gallery/types";
import { mapGalleryItems } from "./mapGallery";

export type GallerySource = "sanity" | "mock";

/**
 * Mock data only when Sanity is not configured. When it is, fetch errors propagate: Next keeps serving the last good
 * ISR page (and a build fails loudly) instead of publishing placeholders. Spec §10 defines no fetch-error state ([OPEN]).
 */
export async function loadGallery(
  configured: boolean,
  fetchRows: () => Promise<unknown[]>,
): Promise<{ items: GalleryItem[]; source: GallerySource }> {
  if (!configured) return { items: createMockItems(), source: "mock" };
  const rows = await fetchRows();
  return { items: mapGalleryItems(rows), source: "sanity" };
}
