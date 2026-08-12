"use client";

import { useCallback, useEffect, useState } from "react";
import type { CssPropertySnapshot } from "@/figma/manifest";
import { propertyToCssKey } from "@/figma/manifest";

export const NODE_OVERRIDES_STORAGE_KEY = "polis-node-overrides";

export type NodeOverridesMap = Record<string, Partial<CssPropertySnapshot>>;

export function findNodeElement(nodeId: string): Element | null {
  return document.querySelector(`[data-node-id="${nodeId}"]`);
}

export function applyOverrideToElement(
  el: Element,
  property: string,
  value: string,
) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.setProperty(propertyToCssKey(property), value);
}

export function clearOverrideFromElement(el: Element, property: string) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.removeProperty(propertyToCssKey(property));
}

export function applyAllOverridesToDom(overrides: NodeOverridesMap) {
  Object.entries(overrides).forEach(([nodeId, props]) => {
    const el = findNodeElement(nodeId);
    if (!el) return;
    Object.entries(props).forEach(([property, value]) => {
      if (value !== undefined) {
        applyOverrideToElement(el, property, value);
      }
    });
  });
}

export function clearNodeOverridesFromDom(
  nodeId: string,
  properties: string[],
) {
  const el = findNodeElement(nodeId);
  if (!el) return;
  properties.forEach((property) => clearOverrideFromElement(el, property));
}

function readInitialOverrides(): NodeOverridesMap {
  if (typeof window === "undefined") return {};

  const stored = localStorage.getItem(NODE_OVERRIDES_STORAGE_KEY);
  if (!stored) return {};

  try {
    return JSON.parse(stored) as NodeOverridesMap;
  } catch {
    return {};
  }
}

export function useLiveNodeOverrides() {
  const [nodeOverrides, setNodeOverrides] =
    useState<NodeOverridesMap>(readInitialOverrides);

  const persist = useCallback((overrides: NodeOverridesMap) => {
    localStorage.setItem(NODE_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  }, []);

  const applyAllOverrides = useCallback(() => {
    applyAllOverridesToDom(nodeOverrides);
  }, [nodeOverrides]);

  useEffect(() => {
    applyAllOverridesToDom(nodeOverrides);
    persist(nodeOverrides);
  }, [nodeOverrides, persist]);

  const setNodeOverride = useCallback(
    (nodeId: string, property: keyof CssPropertySnapshot, value: string) => {
      setNodeOverrides((prev) => {
        const next = {
          ...prev,
          [nodeId]: { ...prev[nodeId], [property]: value },
        };
        return next;
      });

      const el = findNodeElement(nodeId);
      if (el) {
        applyOverrideToElement(el, property, value);
      }
    },
    [],
  );

  const resetNodeOverrides = useCallback(
    (nodeId: string, properties: string[]) => {
      clearNodeOverridesFromDom(nodeId, properties);
      setNodeOverrides((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
    },
    [],
  );

  const exportNodeOverrides = useCallback((): string => {
    const lines: string[] = [];
    Object.entries(nodeOverrides).forEach(([nodeId, props]) => {
      Object.entries(props).forEach(([property, value]) => {
        if (value !== undefined) {
          lines.push(
            `@figma node:${nodeId} property:${propertyToCssKey(property)} value:${value}`,
          );
        }
      });
    });
    return lines.join("\n");
  }, [nodeOverrides]);

  return {
    nodeOverrides,
    setNodeOverride,
    resetNodeOverrides,
    applyAllOverrides,
    exportNodeOverrides,
  };
}
