"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { aspectRatio } from "@/lib/gallery/aspect";
import { MEDIA_DEFAULTS } from "@/lib/gallery/defaults";
import { springEase, toGsapEase } from "@/lib/gallery/easing";
import { type Box, fullBox, handoffBoxes } from "@/lib/gallery/morph";
import { mod } from "@/lib/gallery/orbit";
import type { AspectMorphConfig, BounceConfig } from "@/lib/gallery/props";
import type { Aspect, MediaAsset } from "@/lib/gallery/types";
import { gsap, useGSAP } from "@/lib/gsap";
import { MediaContext } from "./MediaContext";
import { MediaView } from "./MediaView";

export type ActiveMediaStageProps = {
  /** 3–8 assets (spec §8). */
  assets: MediaAsset[];
  /** Settled center card, not expanded: owns the cycle. Becoming active starts a fresh interval. */
  active: boolean;
  /** Space / pause button / off-viewport / hidden tab: freezes the timeline and the video in place. */
  paused?: boolean;
  intervalMs?: number;
  /** Entrance spring (annex). */
  bounce?: Partial<BounceConfig>;
  /** Exit compress + handoff inset (annex). */
  aspectMorph?: Partial<AspectMorphConfig>;
  mediaErrorSkipMs?: number;
  /** Asset `_key` to show first (last shown frame, persisted by the parent). */
  frozenFrame?: string;
  /** Overrides every asset's aspect for the media box. */
  forcedAspect?: Aspect;
  onIndexChange?: (index: number, assetKey: string) => void;
  /** Glass Media context (tag + pause button). */
  controls?: boolean;
  onTogglePause?: () => void;
};

/**
 * Center media cycle (annex choreography, Figma motion context). The visible placeholder IS the media box (.cg-frame):
 * each clip springs out from the handoff box to its full size, holds, compresses into the next clip's handoff box during
 * the last 150ms, then a hard opacity cut. Width/height are animated on an element anchored at the fixed slot's center
 * and centered by transform, so nothing outside it moves (CLS 0).
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
  controls = true,
  onTogglePause,
}: ActiveMediaStageProps) {
  const count = assets.length;
  const [index, setIndex] = useState(() => Math.max(0, assets.findIndex((a) => a._key === frozenFrame)));
  const [cycle, setCycle] = useState(0);
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const [shell, setShell] = useState({ width: 0, height: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const enterBoxRef = useRef<Box | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const pausedRef = useRef(paused);
  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
    pausedRef.current = paused;
  });

  const current = count > 0 ? assets[mod(index, count)] : undefined;
  const aspectOf = (i: number): Aspect => forcedAspect ?? assets[mod(i, count)]?.aspect ?? "16:9";
  const aspect = aspectOf(index);
  const currentFailed = current ? failed.has(current._key) : false;

  const entranceDuration = bounce?.duration ?? MEDIA_DEFAULTS.bounce.duration;
  const spring = bounce?.spring ?? MEDIA_DEFAULTS.bounce.spring;
  const exitDuration = aspectMorph?.duration ?? MEDIA_DEFAULTS.aspectMorph.duration;
  const exitEase = aspectMorph?.ease ?? MEDIA_DEFAULTS.aspectMorph.ease;
  const insetScale = aspectMorph?.insetScale ?? MEDIA_DEFAULTS.aspectMorph.insetScale;
  const springKey = `${spring.decay}|${spring.frequency}|${spring.ratio}`;
  const exitEaseKey = String(exitEase);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setShell({ width: stage.clientWidth, height: stage.clientHeight });
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const frame = frameRef.current;
      timelineRef.current = null;
      if (!active || !frame || count === 0 || shell.width === 0) return;
      const tl = gsap.timeline({ paused: pausedRef.current });
      timelineRef.current = tl;

      const full = fullBox(shell.width, shell.height, aspect);
      const enter = enterBoxRef.current;
      enterBoxRef.current = null;
      if (enter) {
        tl.fromTo(
          frame,
          { width: enter.width, height: enter.height },
          { width: full.width, height: full.height, duration: entranceDuration, ease: springEase(spring) },
          0,
        );
      }
      if (count < 2) return;

      const intervalS = Math.max(0, currentFailed ? mediaErrorSkipMs : intervalMs) / 1000;
      const nextIndex = mod(index + 1, count);
      const boxes = handoffBoxes(shell.width, shell.height, aspect, aspectOf(nextIndex), insetScale);
      const exitAt = Math.max(tl.duration(), intervalS - exitDuration);
      tl.to(
        frame,
        { width: boxes.from.width, height: boxes.from.height, duration: exitDuration, ease: toGsapEase(exitEase) },
        exitAt,
      );
      tl.call(
        () => {
          enterBoxRef.current = boxes.to;
          setCycle((c) => c + 1);
          setIndex(nextIndex);
        },
        [],
        exitAt + exitDuration,
      );
    },
    {
      dependencies: [
        active,
        index,
        count,
        shell.width,
        shell.height,
        intervalMs,
        mediaErrorSkipMs,
        currentFailed,
        entranceDuration,
        springKey,
        exitDuration,
        exitEaseKey,
        insetScale,
        forcedAspect,
      ],
      revertOnUpdate: true,
    },
  );

  useEffect(() => {
    timelineRef.current?.paused(paused);
  }, [paused]);

  const reportedIndex = useRef(index);
  useEffect(() => {
    if (count === 0 || mod(index, count) === mod(reportedIndex.current, count)) return;
    reportedIndex.current = index;
    onIndexChangeRef.current?.(mod(index, count), assets[mod(index, count)]._key);
  }, [index, assets, count]);

  if (!current) return <div className="cg-stage" />;

  const currentIndex = mod(index, count);
  const nextIndex = mod(index + 1, count);
  const mounted = assets.filter((_, i) => i === currentIndex || (active && i === nextIndex));

  return (
    <div ref={stageRef} className="cg-stage" data-aspect={aspect} data-media-index={currentIndex}>
      <div ref={frameRef} className="cg-frame" style={{ "--cg-ratio": String(aspectRatio(aspect)) } as CSSProperties}>
        {mounted.map((asset) => {
          const isCurrent = asset._key === current._key;
          return (
            <div key={asset._key} className="cg-layer" data-current={isCurrent} aria-hidden={!isCurrent || undefined}>
              <MediaView
                asset={asset}
                playing={isCurrent && active && !paused}
                restartToken={isCurrent ? cycle : undefined}
                failed={failed.has(asset._key)}
                eager={active || isCurrent}
                onError={() => setFailed((prev) => new Set(prev).add(asset._key))}
              />
            </div>
          );
        })}
        {controls && (
          <MediaContext
            asset={current}
            showPause={current.kind === "video"}
            paused={paused}
            interactive={active}
            onTogglePause={onTogglePause}
          />
        )}
      </div>
    </div>
  );
}
