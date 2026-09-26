"use client";

import "./site.css";
import { useRef, useState } from "react";
import { Gallery } from "@/components/gallery/Gallery";
import type { GalleryItem } from "@/lib/gallery/types";
import { AboutSheet } from "./AboutSheet";

/** Figma "Desktop home page" (node 591:949): logo, radial/cylindrical gallery, glass About pill → About bottom sheet. */
export function HomePage({ items }: { items: GalleryItem[] }) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="site-home" data-node-id="551:11691" data-expanded={expanded}>
      <Gallery items={items} ariaLabel="Gallery" cylinder={{ locked: aboutOpen }} onExpandChange={setExpanded} />

      {/* eslint-disable-next-line @next/next/no-img-element -- static Figma logo, fixed 56×56 */}
      <img className="site-logo" src="/brand/logo.svg" width={56} height={56} alt="Polis, Works" data-node-id="551:12078" />

      <button
        ref={aboutButtonRef}
        type="button"
        className="site-about cg-glass cg-pressable"
        aria-expanded={aboutOpen}
        aria-controls="about-sheet"
        tabIndex={expanded ? -1 : 0}
        onClick={() => setAboutOpen(true)}
        data-node-id="551:11996"
      >
        About
      </button>

      <AboutSheet open={aboutOpen} onClose={() => setAboutOpen(false)} returnFocusRef={aboutButtonRef} />
    </div>
  );
}
