"use client";

import { useEffect, useState } from "react";
import { useLiveDebug } from "@/context/LiveDebugContext";
import { FigmaDebugOverlay } from "./FigmaDebugOverlay";
import { AdjustmentPanel } from "./AdjustmentPanel";

export function DevTools() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"global" | "selected">("global");
  const {
    selectedNodeId,
    adjustments,
    overlayEnabled,
    setOverlayEnabled,
    updateAdjustment,
    resetAdjustments,
    copyTokens,
    exportNodeOverrides,
  } = useLiveDebug();

  useEffect(() => {
    const handleNodeSelected = () => {
      setPanelOpen(true);
      setActiveTab("selected");
      setOverlayEnabled(true);
    };

    window.addEventListener("live-debug:node-selected", handleNodeSelected);
    return () => {
      window.removeEventListener("live-debug:node-selected", handleNodeSelected);
    };
  }, [setOverlayEnabled]);

  const handleTabChange = (tab: "global" | "selected") => {
    setActiveTab(tab);
    if (tab === "selected") {
      setOverlayEnabled(true);
    }
  };

  const overlayActive = panelOpen && activeTab === "selected" && overlayEnabled;

  const handleCopyAllOverrides = async () => {
    const text = exportNodeOverrides();
    if (text) {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <>
      <FigmaDebugOverlay key={String(overlayActive)} enabled={overlayActive} />
      <AdjustmentPanel
        open={panelOpen}
        onToggle={() => setPanelOpen((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedNodeId={selectedNodeId}
        adjustments={adjustments}
        overlayEnabled={overlayEnabled}
        onOverlayToggle={setOverlayEnabled}
        onUpdate={updateAdjustment}
        onReset={resetAdjustments}
        onCopyTokens={copyTokens}
        onCopyAllOverrides={handleCopyAllOverrides}
      />
    </>
  );
}
