"use client";

import type { MediaAsset } from "@/lib/gallery/types";

export type MediaContextProps = {
  asset: MediaAsset;
  /** Pause button (Figma shows it for video content only). */
  showPause: boolean;
  paused: boolean;
  /** Only the settled center card's control is focusable / clickable. */
  interactive: boolean;
  onTogglePause?: () => void;
};

/** Figma "Media context": glass tag (label · description) + 40px glass pause button, anchored bottom-right. */
export function MediaContext({ asset, showPause, paused, interactive, onTogglePause }: MediaContextProps) {
  const hasTag = Boolean(asset.label || asset.description);
  if (!hasTag && !showPause) return null;
  return (
    <div className="cg-media-context" data-interactive={interactive}>
      {hasTag && (
        <span className="cg-tag cg-glass">
          {asset.label && <span>{asset.label}</span>}
          {asset.description && <span>{asset.description}</span>}
        </span>
      )}
      {showPause && (
        <button
          type="button"
          className="cg-pause cg-glass cg-pressable"
          aria-label={paused ? "Play" : "Pause"}
          aria-pressed={paused}
          tabIndex={interactive ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePause?.();
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static Figma icon, fixed 24px box */}
          <img src="/icons/pause.svg" width={24} height={24} alt="" />
        </button>
      )}
    </div>
  );
}
