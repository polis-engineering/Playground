import type { CSSProperties } from "react";
import { CYLINDER_DEFAULTS } from "@/lib/gallery/defaults";

/** Spec §10 loading state: skeleton cards in the 3 slots, no orbit. */
export function GallerySkeleton({ peekRatio = CYLINDER_DEFAULTS.peekRatio }: { peekRatio?: number }) {
  return (
    <div className="cg-skeleton" style={{ "--cg-peek": String(peekRatio) } as CSSProperties} aria-hidden data-state="loading">
      <div className="cg-skeleton-block" data-slot="top" />
      <div className="cg-skeleton-block" data-slot="center" />
      <div className="cg-skeleton-block" data-slot="bottom" />
    </div>
  );
}
