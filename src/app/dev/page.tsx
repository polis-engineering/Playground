import type { Metadata } from "next";
import { DevPlayground } from "@/components/dev/DevPlayground";
import { getGalleryItems } from "@/sanity/getGalleryItems";

export const metadata: Metadata = {
  title: "agency-site — gallery knobs",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function DevPage() {
  const { items, source } = await getGalleryItems();
  return <DevPlayground serverItems={items} source={source} />;
}
