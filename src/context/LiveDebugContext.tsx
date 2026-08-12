"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CssPropertySnapshot } from "@/figma/manifest";
import {
  getEditableProperties,
  getManifestNode,
  propertyToCssKey,
} from "@/figma/manifest";
import { useDesignAdjustments } from "@/hooks/useDesignAdjustments";
import type { DesignAdjustments } from "@/hooks/useDesignAdjustments";
import { useLiveNodeOverrides } from "@/hooks/useLiveNodeOverrides";

interface LiveDebugContextValue {
  selectedNodeId: string | null;
  nodeOverrides: Record<string, Partial<CssPropertySnapshot>>;
  adjustments: DesignAdjustments;
  overlayEnabled: boolean;
  selectNode: (nodeId: string) => void;
  clearSelection: () => void;
  setNodeOverride: (
    nodeId: string,
    property: keyof CssPropertySnapshot,
    value: string,
  ) => void;
  resetNode: (nodeId: string) => void;
  applyAllOverrides: () => void;
  exportNodeOverrides: () => string;
  exportSelectedSnippet: () => string;
  setOverlayEnabled: (enabled: boolean) => void;
  updateAdjustment: <K extends keyof DesignAdjustments>(
    key: K,
    value: DesignAdjustments[K],
  ) => void;
  resetAdjustments: () => void;
  copyTokens: () => Promise<void>;
}

const LiveDebugContext = createContext<LiveDebugContextValue | null>(null);

export function LiveDebugProvider({ children }: { children: ReactNode }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const {
    adjustments,
    overlayEnabled,
    setOverlayEnabled,
    update,
    reset,
    copyTokens,
  } = useDesignAdjustments();
  const {
    nodeOverrides,
    setNodeOverride,
    resetNodeOverrides,
    applyAllOverrides,
    exportNodeOverrides,
  } = useLiveNodeOverrides();

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const resetNode = useCallback(
    (nodeId: string) => {
      const manifestNode = getManifestNode(nodeId);
      const properties = manifestNode
        ? getEditableProperties(manifestNode).map(String)
        : Object.keys(nodeOverrides[nodeId] ?? {});
      resetNodeOverrides(nodeId, properties);
    },
    [nodeOverrides, resetNodeOverrides],
  );

  const exportSelectedSnippet = useCallback((): string => {
    if (!selectedNodeId) return "";

    const overrides = nodeOverrides[selectedNodeId];
    if (!overrides || Object.keys(overrides).length === 0) {
      return `@figma node:${selectedNodeId} property: inspect value:review`;
    }

    return Object.entries(overrides)
      .filter(([, value]) => value !== undefined)
      .map(
        ([property, value]) =>
          `@figma node:${selectedNodeId} property:${propertyToCssKey(property)} value:${value}`,
      )
      .join("\n");
  }, [selectedNodeId, nodeOverrides]);

  const value = useMemo<LiveDebugContextValue>(
    () => ({
      selectedNodeId,
      nodeOverrides,
      adjustments,
      overlayEnabled,
      selectNode,
      clearSelection,
      setNodeOverride,
      resetNode,
      applyAllOverrides,
      exportNodeOverrides,
      exportSelectedSnippet,
      setOverlayEnabled,
      updateAdjustment: update,
      resetAdjustments: reset,
      copyTokens,
    }),
    [
      selectedNodeId,
      nodeOverrides,
      adjustments,
      overlayEnabled,
      selectNode,
      clearSelection,
      setNodeOverride,
      resetNode,
      applyAllOverrides,
      exportNodeOverrides,
      exportSelectedSnippet,
      setOverlayEnabled,
      update,
      reset,
      copyTokens,
    ],
  );

  return (
    <LiveDebugContext.Provider value={value}>{children}</LiveDebugContext.Provider>
  );
}

export function useLiveDebug(): LiveDebugContextValue {
  const ctx = useContext(LiveDebugContext);
  if (!ctx) {
    throw new Error("useLiveDebug must be used within LiveDebugProvider");
  }
  return ctx;
}

export function useLiveDebugOptional(): LiveDebugContextValue | null {
  return useContext(LiveDebugContext);
}
