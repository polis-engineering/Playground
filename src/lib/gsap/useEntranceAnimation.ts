"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cssVarNames } from "@/figma/tokens";

gsap.registerPlugin(useGSAP);

export function useEntranceAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const motionEnabled =
        getComputedStyle(document.documentElement).getPropertyValue(
          cssVarNames.motionEnabled,
        ) !== "0";

      if (prefersReducedMotion || !motionEnabled) return;

      const stagger = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          cssVarNames.motionStagger,
        ) || "0.08",
      );

      const duration = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          cssVarNames.motionDuration,
        ) || "0.6",
      );

      const targets = root.querySelectorAll("[data-animate='entrance']");

      gsap.fromTo(
        targets,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: "power2.out",
        },
      );
    },
    { scope: containerRef, dependencies: [] },
  );

  return containerRef;
}
