"use client";

import { cardTokensToVars, type CardTokens } from "@/lib/gallery/props";
import type { Aspect, GalleryItem, Slot } from "@/lib/gallery/types";
import { ActiveMediaStage, type ActiveMediaStageProps } from "./ActiveMediaStage";

export type GalleryItemCardProps = CardTokens & {
  item: GalleryItem;
  slot: Slot;
  isActive: boolean;
  isExpanded?: boolean;
  /** Frozen media index shown when inactive (and the start frame when it becomes active). */
  mediaIndex: number;
  /** Frame aspect override; defaults to the current media's aspect. */
  aspect?: Aspect;
  /** Standalone use only — inside CylinderGallery the center click is routed by the cylinder. */
  onExpand?: () => void;
  paused?: boolean;
  media?: Pick<ActiveMediaStageProps, "intervalMs" | "bounce" | "aspectMorph" | "mediaErrorSkipMs">;
  onMediaIndexChange?: (index: number, assetKey: string) => void;
};

/**
 * Fixed placeholder shell (spec §5). Every card keeps one ActiveMediaStage instance so leaving the center keeps the exact
 * last frame (including the paused <video> element); only the active card cycles.
 */
export function GalleryItemCard({
  item,
  slot,
  isActive,
  isExpanded = false,
  mediaIndex,
  aspect,
  onExpand,
  paused = false,
  media,
  onMediaIndexChange,
  ...tokens
}: GalleryItemCardProps) {
  return (
    <div
      className="cg-card"
      style={cardTokensToVars(tokens)}
      data-slot={slot}
      data-active={isActive}
      data-expanded={isExpanded}
      onClick={isActive && onExpand ? onExpand : undefined}
    >
      <ActiveMediaStage
        assets={item.media}
        active={isActive}
        paused={paused || isExpanded}
        frozenFrame={item.media[mediaIndex]?._key}
        forcedAspect={aspect}
        onIndexChange={onMediaIndexChange}
        intervalMs={media?.intervalMs}
        bounce={media?.bounce}
        aspectMorph={media?.aspectMorph}
        mediaErrorSkipMs={media?.mediaErrorSkipMs}
      />
    </div>
  );
}
