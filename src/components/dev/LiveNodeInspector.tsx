"use client";

import { useCallback, useState } from "react";
import {
  getAllManifestNodes,
  getEditableProperties,
  getManifestNode,
  propertyToCssKey,
  type CssPropertySnapshot,
} from "@/figma/manifest";
import { useLiveDebug } from "@/context/LiveDebugContext";

function InspectorField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "color";
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        onInput={(e) => onChange(e.currentTarget.value)}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
      />
    </label>
  );
}

export function LiveNodeInspector() {
  const {
    selectedNodeId,
    nodeOverrides,
    overlayEnabled,
    selectNode,
    setNodeOverride,
    resetNode,
    clearSelection,
    exportSelectedSnippet,
    setOverlayEnabled,
  } = useLiveDebug();
  const [copied, setCopied] = useState(false);

  const handleCopySnippet = useCallback(async () => {
    const snippet = exportSelectedSnippet();
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [exportSelectedSnippet]);

  const handlePickNode = useCallback(
    (nodeId: string) => {
      if (!nodeId) return;
      selectNode(nodeId);
    },
    [selectNode],
  );

  if (!selectedNodeId) {
    const nodes = getAllManifestNodes();

    return (
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          Pick a node below, or click any element on the page while the Figma
          overlay is enabled.
        </p>

        {!overlayEnabled && (
          <button
            type="button"
            onClick={() => setOverlayEnabled(true)}
            className="w-full rounded bg-orange-500 px-2 py-1.5 text-xs text-white hover:bg-orange-600"
          >
            Enable Figma overlay
          </button>
        )}

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-zinc-500">Select node</span>
          <select
            value=""
            onChange={(e) => handlePickNode(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
          >
            <option value="">Choose a Figma node…</option>
            {nodes.map((node) => (
              <option key={node.nodeId} value={node.nodeId}>
                {node.nodeId} — {node.name} ({node.type})
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  const manifestNode = getManifestNode(selectedNodeId);
  if (!manifestNode) {
    return (
      <p className="text-xs text-zinc-500">
        Node {selectedNodeId} not found in manifest
      </p>
    );
  }

  const editableProps = getEditableProperties(manifestNode);
  const overrides = nodeOverrides[selectedNodeId] ?? {};
  const snippet = exportSelectedSnippet();

  const getValue = (prop: keyof CssPropertySnapshot): string => {
    if (overrides[prop] !== undefined) return overrides[prop]!;
    return manifestNode.cssProperties[prop] ?? "";
  };

  const handleChange = (prop: keyof CssPropertySnapshot, value: string) => {
    setNodeOverride(selectedNodeId, prop, value);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-xs font-semibold">{selectedNodeId}</p>
        <p className="text-xs text-zinc-600">{manifestNode.name}</p>
        <p className="font-mono text-[10px] text-zinc-400">
          {manifestNode.componentPath}
        </p>
      </div>

      {editableProps.length === 0 ? (
        <p className="text-xs text-zinc-500">
          No editable properties for this node type.
        </p>
      ) : (
        <div className="space-y-2">
          {editableProps.map((prop) => (
            <InspectorField
              key={prop}
              label={propertyToCssKey(prop)}
              value={getValue(prop)}
              onChange={(v) => handleChange(prop, v)}
              type={prop === "color" ? "color" : "text"}
            />
          ))}
        </div>
      )}

      {snippet && (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Live snippet
          </p>
          <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-zinc-700">
            {snippet}
          </pre>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCopySnippet}
          className="rounded bg-blue-600 px-2 py-1.5 text-xs text-white hover:bg-blue-700"
        >
          {copied ? "Copied!" : "Copy snippet"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => resetNode(selectedNodeId)}
            className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-xs hover:bg-zinc-50"
          >
            Reset node
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-xs hover:bg-zinc-50"
          >
            Clear selection
          </button>
        </div>
      </div>
    </div>
  );
}
