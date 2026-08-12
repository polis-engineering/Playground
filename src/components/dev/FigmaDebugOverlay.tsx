"use client";

import { useCallback, useEffect, useState } from "react";
import { getManifestPath } from "@/figma/manifest";

interface HoveredNode {
  nodeId: string;
  name: string;
  componentPath: string;
  rect: DOMRect;
}

interface FigmaDebugOverlayProps {
  enabled: boolean;
}

export function FigmaDebugOverlay({ enabled }: FigmaDebugOverlayProps) {
  const [hovered, setHovered] = useState<HoveredNode | null>(null);
  const [copied, setCopied] = useState(false);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!enabled) return;

      const target = (event.target as Element | null)?.closest("[data-node-id]");
      if (!target) {
        setHovered(null);
        return;
      }

      const nodeId = target.getAttribute("data-node-id") ?? "";
      const name = target.getAttribute("data-name") ?? "";
      const componentPath = getManifestPath(nodeId) ?? "unknown";

      setHovered({
        nodeId,
        name,
        componentPath,
        rect: target.getBoundingClientRect(),
      });
    },
    [enabled],
  );

  const handleClick = useCallback(
    async (event: MouseEvent) => {
      if (!enabled || !hovered) return;

      event.preventDefault();
      event.stopPropagation();

      const snippet = `@figma node:${hovered.nodeId} property: inspect value:review`;
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    },
    [enabled, hovered],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick, true);
    };
  }, [enabled, handleMouseMove, handleClick]);

  if (!enabled || !hovered) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed z-[9998] border-2 border-blue-500 bg-blue-500/10"
        style={{
          top: hovered.rect.top,
          left: hovered.rect.left,
          width: hovered.rect.width,
          height: hovered.rect.height,
        }}
      />
      <div
        className="pointer-events-none fixed z-[9999] max-w-xs rounded-md bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg"
        style={{
          top: hovered.rect.bottom + 8,
          left: hovered.rect.left,
        }}
      >
        <p className="font-mono font-semibold">{hovered.nodeId}</p>
        <p className="text-zinc-300">{hovered.name}</p>
        <p className="mt-1 font-mono text-[10px] text-zinc-400">
          {hovered.componentPath}
        </p>
        <p className="mt-1 text-[10px] text-blue-300">
          {copied ? "Copied!" : "Click to copy @figma snippet"}
        </p>
      </div>
    </>
  );
}
