import type { ReactNode } from "react";

/** Spec §10 empty state. Copy is [OPEN §12.1] — pass it as children; nothing is rendered by default. */
export function GalleryEmpty({ children }: { children?: ReactNode }) {
  return (
    <div className="cg-empty" data-state="empty">
      {children}
    </div>
  );
}
