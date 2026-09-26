import "@/components/gallery/gallery.css";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";
import { CARD_DEFAULTS } from "@/lib/gallery/defaults";
import { cardTokensToVars } from "@/lib/gallery/props";

export default function Loading() {
  return (
    <main className="cg-root" style={cardTokensToVars(CARD_DEFAULTS)}>
      <GallerySkeleton />
    </main>
  );
}
