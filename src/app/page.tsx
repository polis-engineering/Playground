import { HomePage } from "@/components/site/HomePage";
import { getGalleryItems } from "@/sanity/getGalleryItems";

export const revalidate = 60;

export default async function Home() {
  const { items, source } = await getGalleryItems();
  return (
    <main data-source={source}>
      <HomePage items={items} />
    </main>
  );
}
