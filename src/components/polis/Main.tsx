"use client";

import { Section } from "./Section";
import { useEntranceAnimation } from "@/lib/gsap/useEntranceAnimation";

export function Main() {
  const containerRef = useEntranceAnimation();

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col h-full items-start min-w-px overflow-clip relative w-full"
      data-node-id="88:176"
      data-name="main"
    >
      <Section />
    </div>
  );
}
