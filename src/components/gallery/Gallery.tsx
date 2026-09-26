"use client";

import "./gallery.css";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { CARD_DEFAULTS, CYLINDER_DEFAULTS, EXPAND_DEFAULTS, MEDIA_DEFAULTS } from "@/lib/gallery/defaults";
import { toGsapEase } from "@/lib/gallery/easing";
import { keyToAction, shouldHandleGalleryKey } from "@/lib/gallery/keyboard";
import { mod, resolveInitialSlot } from "@/lib/gallery/orbit";
import {
  type AspectMorphConfig,
  type BounceConfig,
  cardTokensToVars,
  type CardTokens,
  expandTokensToVars,
  type ExpandTokens,
  withDefaults,
} from "@/lib/gallery/props";
import type { StepperOptions } from "@/lib/gallery/stepper";
import type { Aspect, GalleryItem } from "@/lib/gallery/types";
import { gsap, useGSAP } from "@/lib/gsap";
import { CylinderGallery, type CylinderGalleryHandle, type CylinderGalleryProps } from "./CylinderGallery";
import { ExpandShell } from "./ExpandShell";
import { GalleryEmpty } from "./GalleryEmpty";
import { GalleryItemCard } from "./GalleryItemCard";
import { MediaView } from "./MediaView";

export type CylinderKnobs = Omit<
  CylinderGalleryProps,
  "items" | "renderItem" | "onCenterClick" | "gestures" | "tiltTopDeg" | "tiltBottomDeg" | "ref" | "className" | "style"
>;

export type MediaKnobs = {
  intervalMs: number;
  bounce: BounceConfig;
  aspectMorph: AspectMorphConfig;
  mediaErrorSkipMs: number;
  /** Forces the center media paused (in addition to Space / off-viewport / expanded). */
  paused: boolean;
};

export type ExpandKnobs = ExpandTokens &
  Omit<typeof EXPAND_DEFAULTS, "placeholder" | "inset" | "borderRadius" | "background">;

export type GalleryProps = {
  items: GalleryItem[];
  cylinder?: Partial<CylinderKnobs>;
  card?: CardTokens;
  /** GalleryItemCard `aspect` override for every card; default = current media aspect. */
  cardAspect?: Aspect;
  media?: Partial<MediaKnobs>;
  expand?: Partial<ExpandKnobs>;
  gestures?: Partial<StepperOptions>;
  onMediaIndexChange?: (itemIndex: number, mediaIndex: number) => void;
  onExpandChange?: (open: boolean) => void;
  /** Empty-state content; copy is [OPEN §12.1]. */
  emptyState?: ReactNode;
  /** Expand body; defaults to the phase-1 placeholder. */
  expandContent?: ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

function ExpandedMedia({ item, mediaIndex }: { item: GalleryItem; mediaIndex: number }) {
  const asset = item.media[mod(mediaIndex, item.media.length)];
  if (!asset) return null;
  return <MediaView asset={asset} playing={false} eager />;
}

/** Spec "GalleryPage": cylinder + expand overlay + keyboard (§6) + pause sources. */
export function Gallery({
  items,
  cylinder,
  card,
  cardAspect,
  media,
  expand,
  gestures,
  onMediaIndexChange,
  onExpandChange,
  emptyState,
  expandContent,
  ariaLabel,
  className,
  style,
}: GalleryProps) {
  const cyl = withDefaults<
    typeof CYLINDER_DEFAULTS & Pick<CylinderKnobs, "onActiveChange" | "onSnapSettle" | "onLayoutChange">
  >(CYLINDER_DEFAULTS, cylinder);
  const cardTokens = withDefaults<CardTokens>(CARD_DEFAULTS, card);
  const mediaKnobs = withDefaults<typeof MEDIA_DEFAULTS & { paused: boolean }>({ ...MEDIA_DEFAULTS, paused: false }, media);
  const expandKnobs = withDefaults<typeof EXPAND_DEFAULTS>(EXPAND_DEFAULTS, expand);
  const viewportPauseThreshold = mediaKnobs.viewportPauseThreshold;
  const count = items.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const cylinderWrapRef = useRef<HTMLDivElement>(null);
  const cylinderRef = useRef<CylinderGalleryHandle>(null);

  const [activeIndex, setActiveIndex] = useState(() => mod(resolveInitialSlot(cyl.initialIndex, count, cyl.loop), count));
  const [expanded, setExpanded] = useState(false);
  const [originEl, setOriginEl] = useState<HTMLElement | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [inViewport, setInViewport] = useState(true);
  const [docVisible, setDocVisible] = useState(true);
  const [frozen, setFrozen] = useState<Record<string, number>>({});

  const paused = mediaKnobs.paused || userPaused || !inViewport || !docVisible;
  const activeItem = count > 0 ? items[mod(activeIndex, count)] : undefined;

  const openExpand = useCallback(() => {
    const handle = cylinderRef.current;
    if (expanded || cyl.locked || !handle || handle.isSnapping()) return;
    setOriginEl(handle.activeCardElement());
    setExpanded(true);
    onExpandChange?.(true);
  }, [expanded, cyl.locked, onExpandChange]);

  const closeExpand = useCallback(() => {
    if (!expanded) return;
    setExpanded(false);
    onExpandChange?.(false);
  }, [expanded, onExpandChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!shouldHandleGalleryKey(e.target, rootRef.current)) return;
      const action = keyToAction(e.key, { expanded });
      if (!action || action === "collapse") return;
      e.preventDefault();
      if (action === "next") cylinderRef.current?.step(1);
      else if (action === "prev") cylinderRef.current?.step(-1);
      else if (action === "expand") openExpand();
      else if (action === "togglePause") setUserPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, openExpand]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => setInViewport(entry.isIntersecting), {
      threshold: viewportPauseThreshold,
    });
    io.observe(root);
    const onVisibility = () => setDocVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    // A page opened in a background tab starts paused.
    queueMicrotask(onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [viewportPauseThreshold]);

  useGSAP(
    () => {
      if (!cylinderWrapRef.current) return;
      // Out fast as the placeholder takes over; back in while it shrinks home (spec §6: hidden while expanded).
      gsap.to(cylinderWrapRef.current, {
        autoAlpha: expanded ? 0 : 1,
        duration: Math.max(0, expanded ? expandKnobs.cylinderFadeOutMs : expandKnobs.cylinderFadeInMs) / 1000,
        ease: toGsapEase([0.23, 1, 0.32, 1]),
        overwrite: true,
      });
    },
    { dependencies: [expanded], scope: rootRef },
  );

  const rootStyle = {
    ...cardTokensToVars(cardTokens),
    ...expandTokensToVars(expandKnobs),
    ...style,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={className ? `cg-root ${className}` : "cg-root"}
      style={rootStyle}
      data-expanded={expanded}
      data-paused={paused}
    >
      {count === 0 ? (
        <GalleryEmpty>{emptyState}</GalleryEmpty>
      ) : (
        <div ref={cylinderWrapRef} className="cg-cylinder-wrap" aria-hidden={expanded || undefined} inert={expanded}>
          <CylinderGallery
            ref={cylinderRef}
            items={items}
            {...cyl}
            visibleCount={3}
            locked={cyl.locked || expanded}
            tiltTopDeg={cardTokens.tiltTopDeg}
            tiltBottomDeg={cardTokens.tiltBottomDeg}
            gestures={gestures}
            ariaLabel={ariaLabel}
            onSnapSettle={(index) => {
              setActiveIndex(index);
              cyl.onSnapSettle?.(index);
            }}
            onCenterClick={openExpand}
            renderItem={({ item, index, slot, isActive }) => (
              <GalleryItemCard
                item={item}
                slot={slot}
                isActive={isActive}
                isExpanded={expanded && isActive}
                mediaIndex={frozen[item._id] ?? 0}
                aspect={cardAspect}
                paused={paused}
                media={mediaKnobs}
                onTogglePause={() => setUserPaused((p) => !p)}
                onMediaIndexChange={(mediaIndex) => {
                  setFrozen((prev) => ({ ...prev, [item._id]: mediaIndex }));
                  onMediaIndexChange?.(index, mediaIndex);
                }}
              />
            )}
          />
        </div>
      )}
      <ExpandShell
        open={expanded}
        onClose={closeExpand}
        originElement={originEl}
        label={activeItem?.title}
        flipDurationMs={expandKnobs.flipDurationMs}
        flipEase={expandKnobs.flipEase}
        closeDurationMs={expandKnobs.closeDurationMs}
        closeEase={expandKnobs.closeEase}
        mediaHideMs={expandKnobs.mediaHideMs}
        mediaHideBlurPx={expandKnobs.mediaHideBlurPx}
        copyRevealMs={expandKnobs.copyRevealMs}
        copyOffsetPx={expandKnobs.copyOffsetPx}
        copyHideMs={expandKnobs.copyHideMs}
        scroll={expandKnobs.scroll}
        media={activeItem ? <ExpandedMedia item={activeItem} mediaIndex={frozen[activeItem._id] ?? 0} /> : null}
      >
        {expandContent ?? expandKnobs.placeholder}
      </ExpandShell>
      <div className="cg-sr-only" aria-live="polite" aria-atomic="true">
        {activeItem?.title}
      </div>
    </div>
  );
}
