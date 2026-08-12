"use client";

import { useCallback, useState } from "react";
import type { DesignAdjustments } from "@/hooks/useDesignAdjustments";
import { LiveNodeInspector } from "./LiveNodeInspector";

type PanelTab = "global" | "selected";

interface AdjustmentPanelProps {
  open: boolean;
  onToggle: () => void;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  selectedNodeId: string | null;
  adjustments: DesignAdjustments;
  overlayEnabled: boolean;
  onOverlayToggle: (enabled: boolean) => void;
  onUpdate: <K extends keyof DesignAdjustments>(
    key: K,
    value: DesignAdjustments[K],
  ) => void;
  onReset: () => void;
  onCopyTokens: () => void;
  onCopyAllOverrides: () => void;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  step,
}: {
  label: string;
  value: string | number | boolean;
  onChange: (value: string) => void;
  type?: "text" | "number" | "color" | "checkbox";
  min?: number;
  max?: number;
  step?: number;
}) {
  if (type === "checkbox") {
    return (
      <label className="flex items-center justify-between gap-2 text-xs">
        <span>{label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked ? "1" : "0")}
          className="accent-blue-600"
        />
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-zinc-500">{label}</span>
      <input
        type={type}
        value={String(value)}
        min={min}
        max={max}
        step={step}
        onInput={(e) => onChange(e.currentTarget.value)}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
      />
    </label>
  );
}

export function AdjustmentPanel({
  open,
  onToggle,
  activeTab,
  onTabChange,
  selectedNodeId,
  adjustments,
  overlayEnabled,
  onOverlayToggle,
  onUpdate,
  onReset,
  onCopyTokens,
  onCopyAllOverrides,
}: AdjustmentPanelProps) {
  const [copiedOverrides, setCopiedOverrides] = useState(false);

  const handleCopyAllOverrides = useCallback(async () => {
    onCopyAllOverrides();
    setCopiedOverrides(true);
    window.setTimeout(() => setCopiedOverrides(false), 1500);
  }, [onCopyAllOverrides]);

  if (!open) {
    return (
      <button
        type="button"
        data-dev-panel
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-[9997] rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg hover:bg-zinc-800"
      >
        Design Panel
      </button>
    );
  }

  return (
    <div
      data-dev-panel
      className="fixed bottom-4 right-4 z-[9997] w-72 max-h-[80vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Adjustment Panel</h2>
        <button
          type="button"
          onClick={onToggle}
          className="text-xs text-zinc-500 hover:text-zinc-800"
        >
          Close
        </button>
      </div>

      <div className="mb-3 flex gap-1 rounded-md bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() => onTabChange("global")}
          className={`flex-1 rounded px-2 py-1 text-xs font-medium ${
            activeTab === "global"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Global Tokens
        </button>
        <button
          type="button"
          onClick={() => onTabChange("selected")}
          className={`relative flex-1 rounded px-2 py-1 text-xs font-medium ${
            activeTab === "selected"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Selected Node
          {selectedNodeId && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-orange-500" />
          )}
        </button>
      </div>

      {activeTab === "selected" ? (
        <LiveNodeInspector />
      ) : (
        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Typography
            </h3>
            <Field
              label="Base size"
              value={adjustments.fontSize}
              onChange={(v) => onUpdate("fontSize", v)}
            />
            <Field
              label="Line height"
              value={adjustments.lineHeight}
              onChange={(v) => onUpdate("lineHeight", v)}
            />
            <Field
              label="Letter spacing"
              value={adjustments.letterSpacing}
              onChange={(v) => onUpdate("letterSpacing", v)}
            />
            <Field
              label="Name weight"
              value={adjustments.nameWeight}
              onChange={(v) => onUpdate("nameWeight", v)}
            />
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Spacing
            </h3>
            <Field
              label="Container gap"
              value={adjustments.containerGap}
              onChange={(v) => onUpdate("containerGap", v)}
            />
            <Field
              label="Grid gap"
              value={adjustments.gridGap}
              onChange={(v) => onUpdate("gridGap", v)}
            />
            <Field
              label="Section padding X"
              value={adjustments.sectionPaddingX}
              onChange={(v) => onUpdate("sectionPaddingX", v)}
            />
            <Field
              label="Section padding Y"
              value={adjustments.sectionPaddingY}
              onChange={(v) => onUpdate("sectionPaddingY", v)}
            />
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Colors
            </h3>
            <Field
              label="Primary"
              type="color"
              value={adjustments.colorPrimary}
              onChange={(v) => onUpdate("colorPrimary", v)}
            />
            <Field
              label="Muted"
              type="color"
              value={adjustments.colorMuted}
              onChange={(v) => onUpdate("colorMuted", v)}
            />
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Motion
            </h3>
            <Field
              label="Motion enabled"
              type="checkbox"
              value={adjustments.motionEnabled}
              onChange={(v) => onUpdate("motionEnabled", v === "1")}
            />
            <Field
              label="Stagger (s)"
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={adjustments.motionStagger}
              onChange={(v) => onUpdate("motionStagger", v)}
            />
            <Field
              label="Duration (s)"
              type="number"
              step={0.1}
              min={0}
              max={3}
              value={adjustments.motionDuration}
              onChange={(v) => onUpdate("motionDuration", v)}
            />
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Debug
            </h3>
            <Field
              label="Figma overlay"
              type="checkbox"
              value={overlayEnabled}
              onChange={(v) => onOverlayToggle(v === "1")}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCopyTokens}
                className="flex-1 rounded bg-blue-600 px-2 py-1.5 text-xs text-white hover:bg-blue-700"
              >
                Copy tokens
              </button>
              <button
                type="button"
                onClick={onReset}
                className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-xs hover:bg-zinc-50"
              >
                Reset
              </button>
            </div>
            <button
              type="button"
              onClick={handleCopyAllOverrides}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs hover:bg-zinc-50"
            >
              {copiedOverrides ? "Copied overrides!" : "Copy all overrides"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
