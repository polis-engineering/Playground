"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { aspectRatio } from "@/lib/gallery/aspect";
import { MEDIA_DEFAULTS } from "@/lib/gallery/defaults";
import { mod } from "@/lib/gallery/orbit";
import { type AspectMorphConfig, type BounceConfig, imageSources } from "@/lib/gallery/props";
import type { Aspect, MediaAsset } from "@/lib/gallery/types";
import { Flip, gsap, useGSAP } from "@/lib/gsap";
import { MediaView } from "./MediaView";

export type ActiveMediaStageProps = {
  /** 3–8 assets (spec §8). */
  assets: MediaAsset[];
  /** Settled center card. Inactive stages are frozen on their last frame and never cycle. */
  active: boolean;
  /** Space / off-viewport / expanded. */
  paused?: boolean;
  intervalMs?: number;
  bounce?: Partial<BounceConfig>;
  aspectMorph?: Partial<AspectMorphConfig>;
  mediaErrorSkipMs?: number;
  /** Asset `_key` to show first (last shown frame, persisted by the parent). */
  frozenFrame?: string;
  /** Overrides the current asset's aspect for the frame box. */
  forcedAspect?: Aspect;
  onIndexChange?: (index: number, assetKey: string) => void;
};

function preload(asset: MediaAsset | undefined) {
  const image = asset?.kind === "image" ? asset.image : asset?.poster;
  if (!image || typeof Image === "undefined") return;
  const { src, srcSet } = imageSources(image, MEDIA_DEFAULTS.imageWidths);
  const img = new Image();
  if (srcSet) {
    img.sizes = MEDIA_DEFAULTS.imageSizes;
    img.srcset = srcSet;
  }
  img.src = src;
}

/**
 * Center media cycle (spec §5, §7): every `intervalMs` advance, GSAP Flip morphs the absolutely positioned frame to the
 * next aspect inside the fixed shell (outer box never changes → zero CLS), and a scale-only bounce pops the inner node.
 */
export function ActiveMediaStage({
  assets,
  active,
  paused = false,
  intervalMs = MEDIA_DEFAULTS.intervalMs,
  bounce,
  aspectMorph,
  mediaErrorSkipMs = MEDIA_DEFAULTS.mediaErrorSkipMs,
  frozenFrame,
  forcedAspect,
  onIndexChange,
}: ActiveMediaStageProps) {
  const count = assets.length;
  const [index, setIndex] = useState(() => Math.max(0, assets.findIndex((a) => a._key === frozenFrame)));
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const tweensRef = useRef<gsap.core.Animation[]>([]);
  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  });

  const current = count > 0 ? assets[mod(index, count)] : undefined;
  const aspect = forcedAspect ?? current?.aspect ?? "16:9";
  const currentFailed = current ? failed.has(current._key) : false;
  const running = active && !paused && count > 1;

  const bounceDuration = bounce?.duration ?? MEDIA_DEFAULTS.bounce.duration;
  const bounceEase = bounce?.ease ?? MEDIA_DEFAULTS.bounce.ease;
  const bounceFrom = bounce?.fromScale ?? MEDIA_DEFAULTS.bounce.fromScale;
  const morphDuration = aspectMorph?.duration ?? MEDIA_DEFAULTS.aspectMorph.duration;
  const morphEase = aspectMorph?.ease ?? MEDIA_DEFAULTS.aspectMorph.ease;

  // Timer: a fresh delayed call every time the stage (re)starts running or the frame advances.
  useGSAP(
    () => {
      if (!running) return;
      const delayMs = currentFailed ? mediaErrorSkipMs : intervalMs;
      gsap.delayedCall(Math.max(0, delayMs) / 1000, () => {
        if (frameRef.current) flipStateRef.current = Flip.getState(frameRef.current);
        setIndex((i) => (i + 1) % count);
      });
    },
    { dependencies: [running, index, intervalMs, mediaErrorSkipMs, currentFailed, count], revertOnUpdate: true },
  );

  // Aspect morph (Flip on frame) + bounce (scale on inner), after React swapped the media.
  useGSAP(
    () => {
      const state = flipStateRef.current;
      flipStateRef.current = null;
      if (!state || !innerRef.current) return;
      const morph = Flip.from(state, { duration: morphDuration, ease: morphEase });
      const pop = gsap.fromTo(
        innerRef.current,
        { scale: bounceFrom },
        { scale: 1, duration: bounceDuration, ease: bounceEase, overwrite: true },
      );
      tweensRef.current = [morph, pop];
    },
    // revertOnUpdate: each advance reverts (jumps to end + clears) the previous morph/pop, so an idle center card
    // never accumulates animations and a short intervalMs cannot stack two Flips on the frame.
    { dependencies: [index], scope: rootRef, revertOnUpdate: true },
  );

  const reportedIndex = useRef(index);
  useEffect(() => {
    if (count === 0 || mod(index, count) === mod(reportedIndex.current, count)) return;
    reportedIndex.current = index;
    onIndexChangeRef.current?.(mod(index, count), assets[mod(index, count)]._key);
  }, [index, assets, count]);

  useEffect(() => {
    if (active && count > 1) preload(assets[mod(index + 1, count)]);
  }, [index, assets, count, active]);

  // Space pauses in-flight bounce/morph; leaving center jumps them to their end frame.
  useEffect(() => {
    for (const t of tweensRef.current) {
      if (!active) t.progress(1);
      else if (paused) t.pause();
      else t.resume();
    }
  }, [active, paused]);

  if (!current) return <div className="cg-stage" />;

  return (
    <div ref={rootRef} className="cg-stage" data-aspect={aspect} data-media-index={mod(index, count)}>
      <div
        ref={frameRef}
        className="cg-frame"
        style={{ "--cg-ratio": String(aspectRatio(aspect)) } as CSSProperties}
      >
        <div ref={innerRef} className="cg-frame-inner">
          <MediaView
            key={current._key}
            asset={current}
            playing={running}
            failed={currentFailed}
            eager={active}
            onError={() => setFailed((prev) => new Set(prev).add(current._key))}
          />
        </div>
      </div>
    </div>
  );
}
