"use client";

import { useState } from "react";
import { useDesignAdjustments } from "@/hooks/useDesignAdjustments";
import { FigmaDebugOverlay } from "./FigmaDebugOverlay";
import { AdjustmentPanel } from "./AdjustmentPanel";

export function DevTools() {
  const [panelOpen, setPanelOpen] = useState(false);
  const {
    adjustments,
    overlayEnabled,
    setOverlayEnabled,
    update,
    reset,
    copyTokens,
  } = useDesignAdjustments();

  return (
    <>
      <FigmaDebugOverlay enabled={overlayEnabled} />
      <AdjustmentPanel
        open={panelOpen}
        onToggle={() => setPanelOpen((prev) => !prev)}
        adjustments={adjustments}
        overlayEnabled={overlayEnabled}
        onOverlayToggle={setOverlayEnabled}
        onUpdate={update}
        onReset={reset}
        onCopyTokens={copyTokens}
      />
    </>
  );
}
