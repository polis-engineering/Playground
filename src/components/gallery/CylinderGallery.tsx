"use client";

import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CYLINDER_DEFAULTS, GESTURE_DEFAULTS, ORBIT_GUARDS } from "@/lib/gallery/defaults";
import {
  clamp,
  computeOrbitLayout,
  mod,
  type OrbitLayout,
  resolveInitialSlot,
  slotForOffset,
  visibleSlots,
} from "@/lib/gallery/orbit";
import type { OrbitScene } from "@/lib/gallery/orbitScene";
import { createStepper, normalizeWheelDelta, type StepperOptions } from "@/lib/gallery/stepper";
import type { GalleryItem, Slot } from "@/lib/gallery/types";
import { gsap } from "@/lib/gsap";
import { GallerySkeleton } from "./GallerySkeleton";

export type CylinderGalleryHandle = {
  /** ±1 step; ignored while snapping (spec §6). */
  step(direction: 1 | -1): void;
  /** Snap item `index` to center via the shortest wrap path. */
  snapTo(index: number): void;
  /** Slot element of the settled center card (Flip origin for expand). */
  activeCardElement(): HTMLElement | null;
  isSnapping(): boolean;
};

export type CylinderRenderArgs = {
  item: GalleryItem;
  index: number;
  slot: Slot;
  slotKey: number;
  isActive: boolean;
};

export type CylinderGalleryProps = {
  items: GalleryItem[];
  initialIndex?: number;
  /** Locked to 3 (spec §5). */
  visibleCount?: 3;
  peekRatio?: number;
  radius?: number | "auto";
  itemAngularSpacing?: number;
  minVirtualSlots?: number;
  perspectiveFov?: "auto" | number;
  snapDurationMs?: number;
  snapEase?: string;
  loop?: boolean;
  locked?: boolean;
  onActiveChange?: (index: number, direction: 1 | -1) => void;
  onSnapSettle?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
  /** GalleryItemCard tilt overrides (degrees at the ±1 slot). */
  tiltTopDeg?: number;
  tiltBottomDeg?: number;
  gestures?: Partial<StepperOptions>;
  /** Click/tap on the settled center card (expand trigger). */
  onCenterClick?: (index: number) => void;
  renderItem: (args: CylinderRenderArgs) => ReactNode;
  ariaLabel?: string;
  /** Fires after every relayout (resize / prop change) with the solved orbit, incl. `peekAchieved` / `peekReachable`. */
  onLayoutChange?: (layout: OrbitLayout) => void;
  ref?: Ref<CylinderGalleryHandle>;
};

const warnedLayouts = new Set<string>();

function warnUnreachablePeek(layout: OrbitLayout, peekRatio: number) {
  if (process.env.NODE_ENV === "production" || layout.peekReachable) return;
  const key = `${peekRatio}|${layout.fovDeg}|${layout.spacing.toFixed(4)}|${layout.height}`;
  if (warnedLayouts.has(key)) return;
  warnedLayouts.add(key);
  console.warn(
    `[cylinder-gallery] peekRatio ${peekRatio} is unreachable at FOV ${layout.fovDeg}° / spacing ` +
      `${((layout.spacing * 180) / Math.PI).toFixed(1)}° (neighbour peek ${layout.peekAchieved.toFixed(3)}). ` +
      "Lower perspectiveFov or raise minVirtualSlots.",
  );
}

export function CylinderGallery({
  items,
  initialIndex = CYLINDER_DEFAULTS.initialIndex,
  peekRatio = CYLINDER_DEFAULTS.peekRatio,
  radius = CYLINDER_DEFAULTS.radius,
  itemAngularSpacing = CYLINDER_DEFAULTS.itemAngularSpacing,
  minVirtualSlots = CYLINDER_DEFAULTS.minVirtualSlots,
  perspectiveFov = CYLINDER_DEFAULTS.perspectiveFov,
  snapDurationMs = CYLINDER_DEFAULTS.snapDurationMs,
  snapEase = CYLINDER_DEFAULTS.snapEase,
  loop = CYLINDER_DEFAULTS.loop,
  locked = CYLINDER_DEFAULTS.locked,
  onActiveChange,
  onSnapSettle,
  className,
  style,
  tiltTopDeg,
  tiltBottomDeg,
  gestures,
  onCenterClick,
  renderItem,
  ariaLabel,
  onLayoutChange,
  ref,
}: CylinderGalleryProps) {
  const itemCount = items.length;
  const wheelStepThreshold = gestures?.wheelStepThreshold ?? GESTURE_DEFAULTS.wheelStepThreshold;
  const wheelIdleResetMs = gestures?.wheelIdleResetMs ?? GESTURE_DEFAULTS.wheelIdleResetMs;
  const swipeMinDistancePx = gestures?.swipeMinDistancePx ?? GESTURE_DEFAULTS.swipeMinDistancePx;
  const swipeMinVelocity = gestures?.swipeMinVelocity ?? GESTURE_DEFAULTS.swipeMinVelocity;
  const tapSlopPx = gestures?.tapSlopPx ?? GESTURE_DEFAULTS.tapSlopPx;

  const [initialSlot] = useState(() => resolveInitialSlot(initialIndex, itemCount, loop));

  const rootRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OrbitScene | null>(null);
  const cardEls = useRef(new Map<number, HTMLElement>());
  const posRef = useRef({ value: initialSlot });
  const targetRef = useRef(initialSlot);
  const baseRef = useRef(initialSlot);
  const snappingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const stepperRef = useRef<ReturnType<typeof createStepper> | null>(null);

  const [base, setBase] = useState(initialSlot);
  const [settled, setSettled] = useState(initialSlot);
  const [snapping, setSnapping] = useState(false);
  const [ready, setReady] = useState(false);

  const live = useRef({
    itemCount,
    loop,
    locked,
    peekRatio,
    radius,
    itemAngularSpacing,
    minVirtualSlots,
    perspectiveFov,
    tiltTopDeg,
    tiltBottomDeg,
    snapDurationMs,
    snapEase,
    onActiveChange,
    onSnapSettle,
    onCenterClick,
    onLayoutChange,
  });
  useLayoutEffect(() => {
    live.current = {
      itemCount,
      loop,
      locked,
      peekRatio,
      radius,
      itemAngularSpacing,
      minVirtualSlots,
      perspectiveFov,
      tiltTopDeg,
      tiltBottomDeg,
      snapDurationMs,
      snapEase,
      onActiveChange,
      onSnapSettle,
      onCenterClick,
      onLayoutChange,
    };
  });

  useEffect(() => {
    stepperRef.current = createStepper({
      wheelStepThreshold,
      wheelIdleResetMs,
      swipeMinDistancePx,
      swipeMinVelocity,
      tapSlopPx,
    });
  }, [wheelStepThreshold, wheelIdleResetMs, swipeMinDistancePx, swipeMinVelocity, tapSlopPx]);

  const renderAll = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const pos = posRef.current.value;
    cardEls.current.forEach((el, slot) => scene.poseCard(el, slot - pos));
  }, []);

  const relayout = useCallback(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    const scene = sceneRef.current;
    if (!root || !measure || !scene) return;
    const l = live.current;
    const layout = computeOrbitLayout({
      width: root.clientWidth,
      height: root.clientHeight,
      cardHeight: measure.offsetHeight,
      itemCount: l.itemCount,
      peekRatio: l.peekRatio,
      radius: l.radius,
      minVirtualSlots: l.minVirtualSlots,
      perspectiveFov: l.perspectiveFov,
      itemAngularSpacing: l.itemAngularSpacing,
      tiltTopDeg: l.tiltTopDeg,
      tiltBottomDeg: l.tiltBottomDeg,
    });
    scene.setLayout(layout);
    root.dataset.peek = layout.peekAchieved.toFixed(3);
    root.dataset.peekReachable = String(layout.peekReachable);
    warnUnreachablePeek(layout, l.peekRatio);
    l.onLayoutChange?.(layout);
    renderAll();
  }, [renderAll]);

  // Three.js is a lazy chunk (spec §13).
  useEffect(() => {
    let cancelled = false;
    Promise.all([import("three"), import("@/lib/gallery/orbitScene")]).then(([THREE, { createOrbitScene }]) => {
      if (cancelled || !cameraRef.current) return;
      sceneRef.current = createOrbitScene(THREE, cameraRef.current);
      relayout();
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [relayout]);

  useEffect(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) return;
    const observer = new ResizeObserver(() => relayout());
    observer.observe(root);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [relayout]);

  useLayoutEffect(() => {
    relayout();
  }, [relayout, itemCount, peekRatio, radius, itemAngularSpacing, minVirtualSlots, perspectiveFov, tiltTopDeg, tiltBottomDeg]);

  useLayoutEffect(() => {
    renderAll();
  }, [renderAll, base, itemCount, ready]);

  useEffect(() => () => void tweenRef.current?.kill(), []);

  // Without loop the position must be a real list index (a wrapped slot, or one past a shrunk list, maps via mod).
  useLayoutEffect(() => {
    if (loop || itemCount === 0) return;
    const target = targetRef.current;
    const next = mod(target, itemCount);
    if (next === target) return;
    tweenRef.current?.kill();
    snappingRef.current = false;
    posRef.current.value = next;
    targetRef.current = next;
    baseRef.current = next;
    setBase(next);
    setSettled(next);
    setSnapping(false);
    live.current.onSnapSettle?.(next);
    renderAll();
  }, [loop, itemCount, renderAll]);

  const goTo = useCallback(
    (rawTarget: number) => {
      const l = live.current;
      if (l.itemCount === 0 || l.locked) return;
      const target = l.loop ? rawTarget : clamp(rawTarget, 0, l.itemCount - 1);
      const from = targetRef.current;
      if (target === from) return;
      targetRef.current = target;
      snappingRef.current = true;
      setSnapping(true);
      l.onActiveChange?.(mod(target, l.itemCount), target > from ? 1 : -1);
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(posRef.current, {
        value: target,
        duration: Math.max(0, l.snapDurationMs) / 1000,
        ease: l.snapEase,
        onUpdate: () => {
          renderAll();
          const nextBase = Math.round(posRef.current.value);
          if (nextBase !== baseRef.current) {
            baseRef.current = nextBase;
            setBase(nextBase);
          }
        },
        onComplete: () => {
          snappingRef.current = false;
          baseRef.current = target;
          setBase(target);
          setSettled(target);
          setSnapping(false);
          live.current.onSnapSettle?.(mod(target, live.current.itemCount));
        },
      });
    },
    [renderAll],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const busy = () => live.current.locked || snappingRef.current;
    let touch: { id: number; x: number; y: number; t: number; moved: boolean } | null = null;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const h = root.clientHeight;
      const step =
        stepperRef.current?.wheel(
          normalizeWheelDelta(e.deltaY, e.deltaMode, h),
          normalizeWheelDelta(e.deltaX, e.deltaMode, h),
          performance.now(),
          busy(),
        ) ?? 0;
      if (step) goTo(targetRef.current + step);
    };
    const onDown = (e: PointerEvent) => {
      suppressClickRef.current = false;
      if (e.pointerType === "mouse") return;
      touch = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      if (!touch || e.pointerId !== touch.id) return;
      if (Math.hypot(e.clientX - touch.x, e.clientY - touch.y) > tapSlopPx) touch.moved = true;
    };
    const onUp = (e: PointerEvent) => {
      if (!touch || e.pointerId !== touch.id) return;
      const t = touch;
      touch = null;
      if (t.moved) suppressClickRef.current = true;
      const step = stepperRef.current?.swipe(e.clientY - t.y, e.clientX - t.x, e.timeStamp - t.t, busy()) ?? 0;
      if (step) goTo(targetRef.current + step);
    };
    const onCancel = () => {
      touch = null;
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onCancel);
    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
    };
  }, [goTo, tapSlopPx]);

  const onSlotClick = (slot: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const l = live.current;
    if (l.locked) return;
    if (slot === targetRef.current) {
      if (!snappingRef.current) l.onCenterClick?.(mod(slot, l.itemCount));
      return;
    }
    goTo(slot);
  };

  useImperativeHandle(
    ref,
    () => ({
      step(direction) {
        if (!snappingRef.current) goTo(targetRef.current + direction);
      },
      snapTo(index) {
        const l = live.current;
        if (!l.itemCount) return;
        if (!l.loop) return goTo(index);
        let delta = mod(index - mod(targetRef.current, l.itemCount), l.itemCount);
        if (delta > l.itemCount / 2) delta -= l.itemCount;
        goTo(targetRef.current + delta);
      },
      activeCardElement: () => cardEls.current.get(targetRef.current) ?? null,
      isSnapping: () => snappingRef.current,
    }),
    [goTo],
  );

  const slots = visibleSlots(base, ORBIT_GUARDS.renderWindow, itemCount, loop);

  return (
    <div
      ref={rootRef}
      className={className ? `cg-cylinder ${className}` : "cg-cylinder"}
      style={style}
      role="region"
      aria-roledescription="cylinder gallery"
      aria-label={ariaLabel}
      data-ready={ready}
      data-snapping={snapping}
    >
      <div ref={measureRef} className="cg-measure" aria-hidden />
      {!ready && itemCount > 0 && <GallerySkeleton peekRatio={peekRatio} />}
      <div ref={cameraRef} className="cg-camera">
        {slots.map((slot) => {
          const index = mod(slot, itemCount);
          const item = items[index];
          const label = slotForOffset(slot - settled);
          const isActive = slot === settled && !snapping;
          return (
            <div
              key={slot}
              ref={(el) => {
                if (!el) return;
                cardEls.current.set(slot, el);
                sceneRef.current?.poseCard(el, slot - posRef.current.value);
                return () => {
                  if (cardEls.current.get(slot) === el) cardEls.current.delete(slot);
                };
              }}
              className="cg-slot"
              data-slot={label}
              data-slot-key={slot}
              data-index={index}
              role="group"
              aria-roledescription="slide"
              aria-label={item.title}
              aria-hidden={label === "hidden" || undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSlotClick(slot)}
            >
              {renderItem({ item, index, slot: label, slotKey: slot, isActive })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
