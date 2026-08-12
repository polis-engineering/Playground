"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { getManifestPath } from "@/figma/manifest";
import { useLiveDebug } from "@/context/LiveDebugContext";

interface HoveredNode {
  nodeId: string;
  name: string;
  componentPath: string;
  rect: DOMRect;
}

interface FigmaDebugOverlayProps {
  enabled: boolean;
}

function NodeHighlight({
  rect,
  color,
}: {
  rect: DOMRect;
  color: "blue" | "orange";
}) {
  const borderClass =
    color === "orange" ? "border-orange-500 bg-orange-500/10" : "border-blue-500 bg-blue-500/10";

  return (
    <div
      className={`pointer-events-none fixed z-[9998] border-2 ${borderClass}`}
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}

export function FigmaDebugOverlay({ enabled }: FigmaDebugOverlayProps) {
  const { selectedNodeId, selectNode, clearSelection } = useLiveDebug();
  const [hovered, setHovered] = useState<HoveredNode | null>(null);
  const [, bumpLayout] = useReducer((count: number) => count + 1, 0);

  const pinnedRect =
    enabled && selectedNodeId
      ? document
          .querySelector(`[data-node-id="${selectedNodeId}"]`)
          ?.getBoundingClientRect() ?? null
      : null;

  useEffect(() => {
    if (!enabled || !selectedNodeId) return;

    const handleLayoutChange = () => bumpLayout();

    window.addEventListener("scroll", handleLayoutChange, true);
    window.addEventListener("resize", handleLayoutChange);

    return () => {
      window.removeEventListener("scroll", handleLayoutChange, true);
      window.removeEventListener("resize", handleLayoutChange);
    };
  }, [enabled, selectedNodeId]);

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
    (event: MouseEvent) => {
      if (!enabled) return;

      const target = (event.target as Element | null)?.closest("[data-node-id]");
      if (!target || target.closest("[data-dev-panel]")) return;

      event.preventDefault();
      event.stopPropagation();

      const nodeId = target.getAttribute("data-node-id") ?? "";
      if (!nodeId) return;

      selectNode(nodeId);
      window.dispatchEvent(new CustomEvent("live-debug:node-selected"));
    },
    [enabled, selectNode],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || event.key !== "Escape") return;
      clearSelection();
    },
    [enabled, clearSelection],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleClick, handleKeyDown]);

  if (!enabled) return null;

  const showHoverHighlight =
    hovered && hovered.nodeId !== selectedNodeId;
  const pinnedNode = selectedNodeId
    ? {
        nodeId: selectedNodeId,
        name:
          document
            .querySelector(`[data-node-id="${selectedNodeId}"]`)
            ?.getAttribute("data-name") ?? "",
        componentPath: getManifestPath(selectedNodeId) ?? "unknown",
      }
    : null;

  const tooltipNode = hovered ?? pinnedNode;

  return (
    <>
      {pinnedRect && selectedNodeId && (
        <NodeHighlight rect={pinnedRect} color="orange" />
      )}
      {showHoverHighlight && hovered && (
        <NodeHighlight rect={hovered.rect} color="blue" />
      )}
      {tooltipNode && (
        <div
          className="pointer-events-none fixed z-[9999] max-w-xs rounded-md bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{
            top: (hovered?.rect ?? pinnedRect)?.bottom
              ? (hovered?.rect ?? pinnedRect)!.bottom + 8
              : 0,
            left: (hovered?.rect ?? pinnedRect)?.left ?? 0,
          }}
        >
          <p className="font-mono font-semibold">{tooltipNode.nodeId}</p>
          <p className="text-zinc-300">{tooltipNode.name}</p>
          <p className="mt-1 font-mono text-[10px] text-zinc-400">
            {tooltipNode.componentPath}
          </p>
          {selectedNodeId === tooltipNode.nodeId ? (
            <p className="mt-1 text-[10px] text-orange-300">Pinned — edit in panel</p>
          ) : (
            <p className="mt-1 text-[10px] text-blue-300">Click to pin node</p>
          )}
        </div>
      )}
    </>
  );
}
