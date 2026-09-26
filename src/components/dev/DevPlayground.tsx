"use client";

import "./dev.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Gallery, type GalleryProps } from "@/components/gallery/Gallery";
import {
  CARD_DEFAULTS,
  CYLINDER_DEFAULTS,
  EXPAND_DEFAULTS,
  GESTURE_DEFAULTS,
  MEDIA_DEFAULTS,
} from "@/lib/gallery/defaults";
import { createMockItems } from "@/lib/gallery/mock";
import { ASPECTS, type Aspect, type GalleryItem } from "@/lib/gallery/types";
import { AutoNumberKnob, BoolKnob, Locked, NumberKnob, RangeKnob, Section, SelectKnob, TextKnob } from "./knobs";

type Source = "server" | "mock";

function initialState() {
  return {
    data: { source: "server" as Source, mockCount: 3 },
    cylinder: {
      initialIndex: CYLINDER_DEFAULTS.initialIndex,
      peekRatio: CYLINDER_DEFAULTS.peekRatio,
      radius: undefined as number | undefined,
      itemAngularSpacingDeg: undefined as number | undefined,
      minVirtualSlots: CYLINDER_DEFAULTS.minVirtualSlots,
      perspectiveFov: undefined as number | undefined,
      snapDurationMs: CYLINDER_DEFAULTS.snapDurationMs,
      snapEase: CYLINDER_DEFAULTS.snapEase,
      loop: CYLINDER_DEFAULTS.loop,
      locked: CYLINDER_DEFAULTS.locked,
      className: "",
      styleBackground: "#0b0b0c",
    },
    card: {
      width: CARD_DEFAULTS.width,
      height: CARD_DEFAULTS.height,
      borderRadius: CARD_DEFAULTS.borderRadius,
      padding: CARD_DEFAULTS.padding,
      background: CARD_DEFAULTS.background,
      shadow: CARD_DEFAULTS.shadow,
      tiltTopDeg: CARD_DEFAULTS.tiltTopDeg,
      tiltBottomDeg: CARD_DEFAULTS.tiltBottomDeg,
      aspect: "from media" as "from media" | Aspect,
    },
    media: {
      intervalMs: MEDIA_DEFAULTS.intervalMs,
      paused: false,
      bounceDuration: MEDIA_DEFAULTS.bounce.duration,
      bounceEase: MEDIA_DEFAULTS.bounce.ease,
      bounceFromScale: MEDIA_DEFAULTS.bounce.fromScale,
      morphDuration: MEDIA_DEFAULTS.aspectMorph.duration,
      morphEase: MEDIA_DEFAULTS.aspectMorph.ease,
      mediaErrorSkipMs: MEDIA_DEFAULTS.mediaErrorSkipMs,
    },
    expand: {
      flipDurationMs: EXPAND_DEFAULTS.flipDurationMs,
      flipEase: EXPAND_DEFAULTS.flipEase,
      inset: EXPAND_DEFAULTS.inset,
      borderRadius: EXPAND_DEFAULTS.borderRadius,
      background: EXPAND_DEFAULTS.background,
      mediaMaxHeight: EXPAND_DEFAULTS.mediaMaxHeight,
      children: EXPAND_DEFAULTS.placeholder,
    },
    gestures: { ...GESTURE_DEFAULTS },
  };
}

type DevState = ReturnType<typeof initialState>;

const time = () => new Date().toISOString().slice(14, 23);

export function DevPlayground({ serverItems, source }: { serverItems: GalleryItem[]; source: string }) {
  const [s, setS] = useState<DevState>(initialState);
  const [open, setOpen] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [readout, setReadout] = useState({ activeIndex: 0, mediaIndex: 0, expanded: false });
  const [peek, setPeek] = useState({ achieved: 0, reachable: true });

  const set = <K extends keyof DevState>(group: K, patch: Partial<DevState[K]>) =>
    setS((prev) => ({ ...prev, [group]: { ...prev[group], ...patch } }));

  const push = useCallback((line: string) => setLog((prev) => [`${time()} ${line}`, ...prev].slice(0, 30)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !readout.expanded) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readout.expanded]);

  const items = useMemo(
    () => (s.data.source === "mock" ? createMockItems(s.data.mockCount) : serverItems),
    [s.data.source, s.data.mockCount, serverItems],
  );

  const galleryProps: Omit<GalleryProps, "items"> = {
    cylinder: {
      initialIndex: s.cylinder.initialIndex,
      peekRatio: s.cylinder.peekRatio,
      radius: s.cylinder.radius ?? "auto",
      itemAngularSpacing:
        s.cylinder.itemAngularSpacingDeg === undefined ? undefined : (s.cylinder.itemAngularSpacingDeg * Math.PI) / 180,
      minVirtualSlots: s.cylinder.minVirtualSlots,
      perspectiveFov: s.cylinder.perspectiveFov ?? "auto",
      snapDurationMs: s.cylinder.snapDurationMs,
      snapEase: s.cylinder.snapEase,
      loop: s.cylinder.loop,
      locked: s.cylinder.locked,
    },
    card: {
      width: s.card.width,
      height: s.card.height,
      borderRadius: s.card.borderRadius,
      padding: s.card.padding,
      background: s.card.background,
      shadow: s.card.shadow,
      tiltTopDeg: s.card.tiltTopDeg,
      tiltBottomDeg: s.card.tiltBottomDeg,
    },
    cardAspect: s.card.aspect === "from media" ? undefined : s.card.aspect,
    media: {
      intervalMs: s.media.intervalMs,
      paused: s.media.paused,
      bounce: { duration: s.media.bounceDuration, ease: s.media.bounceEase, fromScale: s.media.bounceFromScale },
      aspectMorph: { duration: s.media.morphDuration, ease: s.media.morphEase },
      mediaErrorSkipMs: s.media.mediaErrorSkipMs,
    },
    expand: {
      flipDurationMs: s.expand.flipDurationMs,
      flipEase: s.expand.flipEase,
      inset: s.expand.inset,
      borderRadius: s.expand.borderRadius,
      background: s.expand.background,
      mediaMaxHeight: s.expand.mediaMaxHeight,
    },
    expandContent: s.expand.children,
    gestures: s.gestures,
    className: s.cylinder.className || undefined,
    style: { background: s.cylinder.styleBackground },
  };

  const remountKey = `${s.data.source}-${s.data.mockCount}-${s.cylinder.initialIndex}`;

  return (
    <div className="dv-root">
      <Gallery
        key={remountKey}
        items={items}
        ariaLabel="Gallery"
        {...galleryProps}
        cylinder={{
          ...galleryProps.cylinder,
          onActiveChange: (index, direction) => push(`onActiveChange(${index}, ${direction})`),
          onLayoutChange: (layout) =>
            setPeek((p) =>
              p.achieved === layout.peekAchieved && p.reachable === layout.peekReachable
                ? p
                : { achieved: layout.peekAchieved, reachable: layout.peekReachable },
            ),
          onSnapSettle: (index) => {
            push(`onSnapSettle(${index})`);
            setReadout((r) => ({ ...r, activeIndex: index }));
          },
        }}
        onMediaIndexChange={(itemIndex, mediaIndex) => {
          push(`onIndexChange(item ${itemIndex} → media ${mediaIndex})`);
          setReadout((r) => ({ ...r, mediaIndex }));
        }}
        onExpandChange={(expanded) => {
          push(expanded ? "onExpand()" : "onClose()");
          setReadout((r) => ({ ...r, expanded }));
        }}
      />

      <button type="button" className="dv-toggle" onClick={() => setOpen((o) => !o)} data-gallery-ignore-keys>
        {open ? "Hide knobs" : "Knobs"}
      </button>

      {open && (
        <aside className="dv-panel" data-gallery-ignore-keys aria-label="Gallery knobs">
          <div className="dv-readout">
            <span>source: {s.data.source === "mock" ? "mock" : source}</span>
            <span>items: {items.length}</span>
            <span>active: {readout.activeIndex}</span>
            <span>media: {readout.mediaIndex}</span>
            <span>expanded: {String(readout.expanded)}</span>
            <span style={peek.reachable ? undefined : { color: "#f87171" }}>
              peek: {peek.achieved.toFixed(3)}
              {peek.reachable ? "" : " (unreachable)"}
            </span>
          </div>
          <div className="dv-actions">
            <button type="button" onClick={() => setS(initialState())}>
              Reset
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(JSON.stringify(galleryProps, null, 2)).then(() => push("props copied"))}
            >
              Copy props JSON
            </button>
          </div>

          <Section title="Data">
            <SelectKnob
              label="items source"
              value={s.data.source}
              options={["server", "mock"] as const}
              onChange={(source) => set("data", { source })}
            />
            <NumberKnob
              label="mock item count"
              hint="0 = empty state"
              value={s.data.mockCount}
              min={0}
              max={40}
              step={1}
              onChange={(mockCount) => set("data", { mockCount: Math.max(0, Math.round(mockCount)), source: "mock" })}
            />
          </Section>

          <Section title="CylinderGallery">
            <NumberKnob label="initialIndex" hint="remounts" value={s.cylinder.initialIndex} step={1} onChange={(v) => set("cylinder", { initialIndex: Math.round(v) })} />
            <Locked label="visibleCount" value="3" />
            <RangeKnob label="peekRatio" value={s.cylinder.peekRatio} min={0} max={0.9} step={0.01} onChange={(peekRatio) => set("cylinder", { peekRatio })} />
            <AutoNumberKnob label="radius" hint="px" value={s.cylinder.radius} fallback={1200} min={0} step={10} onChange={(radius) => set("cylinder", { radius })} />
            <AutoNumberKnob
              label="itemAngularSpacing"
              hint="degrees here, radians in the prop"
              autoLabel="derived"
              value={s.cylinder.itemAngularSpacingDeg}
              fallback={30}
              min={1}
              max={89}
              step={1}
              onChange={(itemAngularSpacingDeg) => set("cylinder", { itemAngularSpacingDeg })}
            />
            <NumberKnob label="minVirtualSlots" value={s.cylinder.minVirtualSlots} min={1} max={60} step={1} onChange={(v) => set("cylinder", { minVirtualSlots: Math.round(v) })} />
            <AutoNumberKnob label="perspectiveFov" hint="vertical °" value={s.cylinder.perspectiveFov} fallback={30} min={1} max={170} step={1} onChange={(perspectiveFov) => set("cylinder", { perspectiveFov })} />
            <NumberKnob label="snapDurationMs" value={s.cylinder.snapDurationMs} min={0} max={3000} step={10} onChange={(snapDurationMs) => set("cylinder", { snapDurationMs })} />
            <TextKnob label="snapEase" hint="GSAP ease" value={s.cylinder.snapEase} onChange={(snapEase) => set("cylinder", { snapEase })} />
            <BoolKnob label="loop" value={s.cylinder.loop} onChange={(loop) => set("cylinder", { loop })} />
            <BoolKnob label="locked" value={s.cylinder.locked} onChange={(locked) => set("cylinder", { locked })} />
            <TextKnob label="className" value={s.cylinder.className} onChange={(className) => set("cylinder", { className })} />
            <TextKnob label="style.background" value={s.cylinder.styleBackground} onChange={(styleBackground) => set("cylinder", { styleBackground })} />
          </Section>

          <Section title="GalleryItemCard">
            <TextKnob label="width" value={s.card.width} onChange={(width) => set("card", { width })} />
            <TextKnob label="height" value={s.card.height} onChange={(height) => set("card", { height })} />
            <TextKnob label="borderRadius" value={s.card.borderRadius} onChange={(borderRadius) => set("card", { borderRadius })} />
            <TextKnob label="padding" value={s.card.padding} onChange={(padding) => set("card", { padding })} />
            <TextKnob label="background" value={s.card.background} onChange={(background) => set("card", { background })} />
            <TextKnob label="shadow" value={s.card.shadow} onChange={(shadow) => set("card", { shadow })} />
            <AutoNumberKnob label="tiltTopDeg" autoLabel="derived" value={s.card.tiltTopDeg} fallback={30} step={1} onChange={(tiltTopDeg) => set("card", { tiltTopDeg })} />
            <AutoNumberKnob label="tiltBottomDeg" autoLabel="derived" value={s.card.tiltBottomDeg} fallback={30} step={1} onChange={(tiltBottomDeg) => set("card", { tiltBottomDeg })} />
            <SelectKnob
              label="aspect"
              value={s.card.aspect}
              options={["from media", ...ASPECTS] as const}
              onChange={(aspect) => set("card", { aspect })}
            />
          </Section>

          <Section title="ActiveMediaStage">
            <NumberKnob label="intervalMs" value={s.media.intervalMs} min={100} max={20000} step={100} onChange={(intervalMs) => set("media", { intervalMs })} />
            <BoolKnob label="paused" hint="Space toggles too" value={s.media.paused} onChange={(paused) => set("media", { paused })} />
            <NumberKnob label="bounce.duration" hint="s" value={s.media.bounceDuration} min={0} max={3} step={0.05} onChange={(bounceDuration) => set("media", { bounceDuration })} />
            <TextKnob label="bounce.ease" value={s.media.bounceEase} onChange={(bounceEase) => set("media", { bounceEase })} />
            <NumberKnob label="bounce.fromScale" value={s.media.bounceFromScale} min={0} max={2} step={0.01} onChange={(bounceFromScale) => set("media", { bounceFromScale })} />
            <NumberKnob label="aspectMorph.duration" hint="s" value={s.media.morphDuration} min={0} max={3} step={0.05} onChange={(morphDuration) => set("media", { morphDuration })} />
            <TextKnob label="aspectMorph.ease" value={s.media.morphEase} onChange={(morphEase) => set("media", { morphEase })} />
            <NumberKnob label="mediaErrorSkipMs" value={s.media.mediaErrorSkipMs} min={0} max={10000} step={100} onChange={(mediaErrorSkipMs) => set("media", { mediaErrorSkipMs })} />
          </Section>

          <Section title="ExpandShell">
            <NumberKnob label="flipDurationMs" value={s.expand.flipDurationMs} min={0} max={3000} step={10} onChange={(flipDurationMs) => set("expand", { flipDurationMs })} />
            <TextKnob label="flipEase" value={s.expand.flipEase} onChange={(flipEase) => set("expand", { flipEase })} />
            <Locked label="scroll" value="vertical" />
            <TextKnob label="inset" value={s.expand.inset} onChange={(inset) => set("expand", { inset })} />
            <TextKnob label="borderRadius" value={s.expand.borderRadius} onChange={(borderRadius) => set("expand", { borderRadius })} />
            <TextKnob label="background" value={s.expand.background} onChange={(background) => set("expand", { background })} />
            <TextKnob label="mediaMaxHeight" value={s.expand.mediaMaxHeight} onChange={(mediaMaxHeight) => set("expand", { mediaMaxHeight })} />
            <TextKnob label="children" hint="phase 1 = placeholder" value={s.expand.children} onChange={(children) => set("expand", { children })} />
          </Section>

          <Section title="Gestures">
            <NumberKnob label="wheelStepThreshold" hint="px" value={s.gestures.wheelStepThreshold} min={1} step={1} onChange={(wheelStepThreshold) => set("gestures", { wheelStepThreshold })} />
            <NumberKnob label="wheelIdleResetMs" value={s.gestures.wheelIdleResetMs} min={0} step={10} onChange={(wheelIdleResetMs) => set("gestures", { wheelIdleResetMs })} />
            <NumberKnob label="swipeMinDistancePx" value={s.gestures.swipeMinDistancePx} min={1} step={1} onChange={(swipeMinDistancePx) => set("gestures", { swipeMinDistancePx })} />
            <NumberKnob label="swipeMinVelocity" hint="px/ms" value={s.gestures.swipeMinVelocity} min={0} step={0.05} onChange={(swipeMinVelocity) => set("gestures", { swipeMinVelocity })} />
            <NumberKnob label="tapSlopPx" value={s.gestures.tapSlopPx} min={0} step={1} onChange={(tapSlopPx) => set("gestures", { tapSlopPx })} />
          </Section>

          <Section title="Events">
            <pre className="dv-log">{log.join("\n") || "—"}</pre>
          </Section>
        </aside>
      )}
    </div>
  );
}
