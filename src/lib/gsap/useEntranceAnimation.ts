"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cssVarNames } from "@/figma/tokens";
import { useLiveDebugOptional } from "@/context/LiveDebugContext";

gsap.registerPlugin(useGSAP);

export function useEntranceAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const liveDebug = useLiveDebugOptional();

  const motionEnabled = liveDebug?.adjustments.motionEnabled;
  const motionStagger = liveDebug?.adjustments.motionStagger;
  const motionDuration = liveDebug?.adjustments.motionDuration;

  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const enabled =
        getComputedStyle(document.documentElement).getPropertyValue(
          cssVarNames.motionEnabled,
        ) !== "0";

      if (prefersReducedMotion || !enabled) return;

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
    {
      scope: containerRef,
      dependencies: [motionEnabled, motionStagger, motionDuration],
      revertOnUpdate: true,
    },
  );

  return containerRef;
}
