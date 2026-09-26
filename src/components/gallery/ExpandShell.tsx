"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { EXPAND_DEFAULTS } from "@/lib/gallery/defaults";
import { type EaseValue, toGsapEase } from "@/lib/gallery/easing";
import { Flip, gsap, useGSAP } from "@/lib/gsap";

export type ExpandShellProps = {
  open: boolean;
  /** Esc and the close control. */
  onClose: () => void;
  /** Phase 1 body: "Soon, check back later" (spec §5, [FACT]). */
  children?: ReactNode;
  /** Only "vertical" (spec §5). */
  scroll?: "vertical";
  flipDurationMs?: number;
  flipEase?: EaseValue;
  closeDurationMs?: number;
  closeEase?: EaseValue;
  mediaHideMs?: number;
  mediaHideBlurPx?: number;
  copyRevealMs?: number;
  copyOffsetPx?: number;
  copyHideMs?: number;
  /** Card slot to Flip from/to (its visible media box is used); focus returns here. */
  originElement?: HTMLElement | null;
  /** Accessible name of the dialog (item title). */
  label?: string;
  /** The card's current media; fills the placeholder while it grows, then fades out (empty placeholder). */
  media?: ReactNode;
  onClosed?: () => void;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),video[controls],[contenteditable="true"],[tabindex]:not([tabindex="-1"])';

const FADE_EASE: EaseValue = [0.23, 1, 0.32, 1];

/** The visible placeholder of a card slot (media box), falling back to the slot itself. */
function flipTarget(origin: HTMLElement) {
  return origin.querySelector<HTMLElement>(".cg-frame") ?? origin;
}

/**
 * Expand (spec §7): Flip from the active card's media box to the full placeholder while the media fades out, then reveal
 * the body; reverse on close. Flip.fit measures bounds, so the origin can live inside the 3D orbit.
 */
export function ExpandShell({
  open,
  onClose,
  children = EXPAND_DEFAULTS.placeholder,
  scroll = EXPAND_DEFAULTS.scroll,
  flipDurationMs = EXPAND_DEFAULTS.flipDurationMs,
  flipEase = EXPAND_DEFAULTS.flipEase,
  closeDurationMs = EXPAND_DEFAULTS.closeDurationMs,
  closeEase = EXPAND_DEFAULTS.closeEase,
  mediaHideMs = EXPAND_DEFAULTS.mediaHideMs,
  mediaHideBlurPx = EXPAND_DEFAULTS.mediaHideBlurPx,
  copyRevealMs = EXPAND_DEFAULTS.copyRevealMs,
  copyOffsetPx = EXPAND_DEFAULTS.copyOffsetPx,
  copyHideMs = EXPAND_DEFAULTS.copyHideMs,
  originElement,
  label,
  media,
  onClosed,
}: ExpandShellProps) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const flipRef = useRef<gsap.core.Animation | null>(null);
  const onCloseRef = useRef(onClose);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onCloseRef.current = onClose;
    onClosedRef.current = onClosed;
  });

  useGSAP(
    () => {
      const panel = panelRef.current;
      const mediaEl = mediaRef.current;
      const copy = copyRef.current;
      const scrollEl = scrollRef.current;
      const close = closeRef.current;
      if (!mounted || !panel || !mediaEl || !copy || !scrollEl || !close) return;
      const s = (ms: number) => Math.max(0, ms) / 1000;
      const origin = originElement?.isConnected ? originElement : null;
      const target = origin ? flipTarget(origin) : null;
      const radius = target ? getComputedStyle(target).borderRadius : undefined;
      const fade = toGsapEase(FADE_EASE);

      // Interrupting (Esc mid-open, Enter mid-close) continues from the panel's current geometry: the running flip is
      // killed, never reverted, so nothing snaps to its start or end first.
      const interrupted = Boolean(flipRef.current?.isActive());
      flipRef.current?.kill();
      flipRef.current = null;
      gsap.killTweensOf([copy, close, mediaEl]);
      // No scrollbar while the panel is smaller than its content mid-flip.
      gsap.set(scrollEl, { overflowY: "hidden" });

      if (open) {
        panel.focus({ preventScroll: true });
        if (!interrupted) {
          gsap.set(copy, { autoAlpha: 0, y: copyOffsetPx });
          gsap.set(close, { opacity: 0 });
          gsap.set(mediaEl, { opacity: 1, filter: "blur(0px)" });
        }
        gsap.to(mediaEl, { opacity: 0, filter: `blur(${mediaHideBlurPx}px)`, duration: s(mediaHideMs), ease: fade });
        const reveal = () => {
          flipRef.current = null;
          gsap.set(scrollEl, { clearProps: "overflowY" });
          gsap.to(copy, { autoAlpha: 1, y: 0, duration: s(copyRevealMs), ease: fade });
          // opacity only: autoAlpha's first frame (visibility: hidden) would blur the focused button.
          gsap.to(close, { opacity: 1, duration: s(copyRevealMs), ease: fade });
          close.focus({ preventScroll: true });
        };
        const duration = s(flipDurationMs);
        const ease = toGsapEase(flipEase);
        if (interrupted) {
          const state = Flip.getState(panel, { props: "borderRadius" });
          gsap.set(panel, { clearProps: "all" });
          flipRef.current = Flip.from(state, { duration, ease, onComplete: reveal });
        } else if (target) {
          flipRef.current = Flip.fit(panel, target, {
            duration,
            ease,
            runBackwards: true,
            borderRadius: radius,
            onComplete: reveal,
          }) as gsap.core.Tween | null;
        } else {
          flipRef.current = gsap.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration, ease, onComplete: reveal });
        }
        return;
      }

      const duration = s(closeDurationMs);
      const finish = () => {
        flipRef.current = null;
        setMounted(false);
        origin?.focus({ preventScroll: true });
        onClosedRef.current?.();
      };
      gsap.to(copy, { autoAlpha: 0, y: copyOffsetPx / 2, duration: s(copyHideMs), ease: fade });
      gsap.to(close, { opacity: 0, duration: s(copyHideMs), ease: fade });
      gsap.to(mediaEl, {
        opacity: 1,
        filter: "blur(0px)",
        duration: Math.min(s(mediaHideMs), duration),
        delay: Math.max(0, duration - s(mediaHideMs)),
        ease: fade,
      });
      flipRef.current = target
        ? (Flip.fit(panel, target, {
            duration,
            ease: toGsapEase(closeEase),
            borderRadius: radius,
            onComplete: finish,
          }) as gsap.core.Tween | null)
        : gsap.to(panel, { autoAlpha: 0, duration, ease: toGsapEase(closeEase), onComplete: finish });
    },
    { dependencies: [open, mounted] },
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const inside = panelRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      ref={panelRef}
      className="cg-expand"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-scroll={scroll}
      data-state={open ? "open" : "closing"}
    >
      <div ref={mediaRef} className="cg-expand-media" aria-hidden>
        {media}
      </div>
      <button ref={closeRef} type="button" className="cg-expand-close cg-glass cg-pressable" aria-label="Close" onClick={onClose}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static Figma icon, fixed 24px box */}
        <img src="/icons/close.svg" width={24} height={24} alt="" />
      </button>
      <div ref={scrollRef} className="cg-expand-scroll" tabIndex={0}>
        <div ref={copyRef} className="cg-expand-body">
          {children}
        </div>
      </div>
    </div>
  );
}
