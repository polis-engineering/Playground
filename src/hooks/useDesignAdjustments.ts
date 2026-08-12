"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cssVarNames,
  defaultTokenValues,
  designTokens,
  tokensToJson,
  type CssVarName,
} from "@/figma/tokens";

export interface DesignAdjustments {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  colorPrimary: string;
  colorMuted: string;
  containerGap: string;
  gridGap: string;
  sectionPaddingX: string;
  sectionPaddingY: string;
  nameWeight: string;
  motionEnabled: boolean;
  motionStagger: string;
  motionDuration: string;
}

const STORAGE_KEY = "polis-design-adjustments";

function fromDefaults(): DesignAdjustments {
  return {
    fontSize: designTokens.fontSize,
    lineHeight: designTokens.lineHeight,
    letterSpacing: designTokens.letterSpacing,
    colorPrimary: designTokens.colorPrimary,
    colorMuted: designTokens.colorMuted,
    containerGap: designTokens.containerGap,
    gridGap: designTokens.gridGap,
    sectionPaddingX: designTokens.sectionPaddingX,
    sectionPaddingY: designTokens.sectionPaddingYDesktop,
    nameWeight: designTokens.nameWeight,
    motionEnabled: true,
    motionStagger: designTokens.motionStagger,
    motionDuration: designTokens.motionDuration,
  };
}

export function applyAdjustmentsToDocument(adjustments: DesignAdjustments) {
  const root = document.documentElement;
  const vars: [CssVarName, string][] = [
    [cssVarNames.fontSize, adjustments.fontSize],
    [cssVarNames.lineHeight, adjustments.lineHeight],
    [cssVarNames.letterSpacing, adjustments.letterSpacing],
    [cssVarNames.colorPrimary, adjustments.colorPrimary],
    [cssVarNames.colorMuted, adjustments.colorMuted],
    [cssVarNames.containerGap, adjustments.containerGap],
    [cssVarNames.gridGap, adjustments.gridGap],
    [cssVarNames.sectionPaddingX, adjustments.sectionPaddingX],
    [cssVarNames.sectionPaddingY, adjustments.sectionPaddingY],
    [cssVarNames.nameWeight, adjustments.nameWeight],
    [cssVarNames.motionEnabled, adjustments.motionEnabled ? "1" : "0"],
    [cssVarNames.motionStagger, adjustments.motionStagger],
    [cssVarNames.motionDuration, adjustments.motionDuration],
  ];

  vars.forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

function readInitialAdjustments(): DesignAdjustments {
  if (typeof window === "undefined") return fromDefaults();

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return fromDefaults();

  try {
    return JSON.parse(stored) as DesignAdjustments;
  } catch {
    return fromDefaults();
  }
}

function readInitialOverlayEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "figma";
}

export function useDesignAdjustments() {
  const [adjustments, setAdjustments] = useState<DesignAdjustments>(
    readInitialAdjustments,
  );
  const [overlayEnabled, setOverlayEnabled] = useState(readInitialOverlayEnabled);

  useEffect(() => {
    applyAdjustmentsToDocument(adjustments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adjustments));
  }, [adjustments]);

  const update = useCallback(
    <K extends keyof DesignAdjustments>(key: K, value: DesignAdjustments[K]) => {
      setAdjustments((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => {
    setAdjustments(fromDefaults());
    const root = document.documentElement;
    Object.entries(defaultTokenValues).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  const copyTokens = useCallback(async () => {
    const payload = {
      tokens: {
        fontSize: adjustments.fontSize,
        lineHeight: adjustments.lineHeight,
        letterSpacing: adjustments.letterSpacing,
        colorPrimary: adjustments.colorPrimary,
        colorMuted: adjustments.colorMuted,
        containerGap: adjustments.containerGap,
        gridGap: adjustments.gridGap,
        sectionPaddingX: adjustments.sectionPaddingX,
        sectionPaddingY: adjustments.sectionPaddingY,
        nameWeight: adjustments.nameWeight,
        motionStagger: adjustments.motionStagger,
        motionDuration: adjustments.motionDuration,
      },
    };
    await navigator.clipboard.writeText(tokensToJson(payload.tokens));
  }, [adjustments]);

  return {
    adjustments,
    overlayEnabled,
    setOverlayEnabled,
    update,
    reset,
    copyTokens,
  };
}
