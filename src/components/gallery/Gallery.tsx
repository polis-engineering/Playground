"use client";

import "./gallery.css";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { aspectRatio } from "@/lib/gallery/aspect";
import { CARD_DEFAULTS, CYLINDER_DEFAULTS, EXPAND_DEFAULTS, MEDIA_DEFAULTS } from "@/lib/gallery/defaults";
import { isEditableTarget, keyToAction } from "@/lib/gallery/keyboard";
import { mod } from "@/lib/gallery/orbit";
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

export type ExpandKnobs = ExpandTokens & {
  flipDurationMs: number;
  flipEase: string;
  scroll: "vertical";
};

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

function ExpandedMedia({ item, mediaIndex, shellRatio }: { item: GalleryItem; mediaIndex: number; shellRatio?: number }) {
  const asset = item.media[mod(mediaIndex, item.media.length)];
  if (!asset) return null;
  const vars: Record<string, string> = { "--cg-ratio": String(aspectRatio(asset.aspect)) };
  if (shellRatio) vars["--cg-shell-ratio"] = String(shellRatio);
  return (
    <div className="cg-expand-media" style={vars as CSSProperties}>
      <div className="cg-frame">
        <MediaView asset={asset} playing={false} eager />
      </div>
    </div>
  );
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
  const cyl = withDefaults<typeof CYLINDER_DEFAULTS & Pick<CylinderKnobs, "onActiveChange" | "onSnapSettle">>(
    CYLINDER_DEFAULTS,
    cylinder,
  );
  const cardTokens = withDefaults<CardTokens>(CARD_DEFAULTS, card);
  const mediaKnobs = withDefaults<typeof MEDIA_DEFAULTS & { paused: boolean }>({ ...MEDIA_DEFAULTS, paused: false }, media);
  const expandKnobs = withDefaults<typeof EXPAND_DEFAULTS>(EXPAND_DEFAULTS, expand);
  const count = items.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const cylinderWrapRef = useRef<HTMLDivElement>(null);
  const cylinderRef = useRef<CylinderGalleryHandle>(null);

  const [activeIndex, setActiveIndex] = useState(() => mod(Math.round(cyl.initialIndex), count));
  const [expanded, setExpanded] = useState(false);
  const [originEl, setOriginEl] = useState<HTMLElement | null>(null);
  const [shellRatio, setShellRatio] = useState<number | undefined>();
  const [userPaused, setUserPaused] = useState(false);
  const [inViewport, setInViewport] = useState(true);
  const [docVisible, setDocVisible] = useState(true);
  const [frozen, setFrozen] = useState<Record<string, number>>({});

  const paused = mediaKnobs.paused || userPaused || !inViewport || !docVisible;
  const activeItem = count > 0 ? items[mod(activeIndex, count)] : undefined;

  const openExpand = useCallback(() => {
    const handle = cylinderRef.current;
    if (expanded || cyl.locked || !handle || handle.isSnapping()) return;
    const origin = handle.activeCardElement();
    setOriginEl(origin);
    setShellRatio(origin && origin.offsetHeight > 0 ? origin.offsetWidth / origin.offsetHeight : undefined);
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
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isEditableTarget(e.target)) return;
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
    const io = new IntersectionObserver(([entry]) => setInViewport(entry.isIntersecting), { threshold: 0.25 });
    io.observe(root);
    const onVisibility = () => setDocVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useGSAP(
    () => {
      if (!cylinderWrapRef.current) return;
      gsap.to(cylinderWrapRef.current, {
        autoAlpha: expanded ? 0 : 1,
        duration: Math.max(0, expandKnobs.flipDurationMs) / 1000,
        ease: expandKnobs.flipEase,
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
        scroll={expandKnobs.scroll}
        media={
          activeItem ? (
            <ExpandedMedia item={activeItem} mediaIndex={frozen[activeItem._id] ?? 0} shellRatio={shellRatio} />
          ) : null
        }
      >
        {expandContent ?? expandKnobs.placeholder}
      </ExpandShell>
      <div className="cg-sr-only" aria-live="polite" aria-atomic="true">
        {activeItem?.title}
      </div>
    </div>
  );
}
