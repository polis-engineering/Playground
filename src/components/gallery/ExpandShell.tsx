"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { EXPAND_DEFAULTS } from "@/lib/gallery/defaults";
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
  flipEase?: string;
  /** Card to Flip from on open and back to on close; focus returns here. */
  originElement?: HTMLElement | null;
  /** Accessible name of the dialog (item title). */
  label?: string;
  /** Active item media, scaled up. Rendered above the body inside the scroll area. */
  media?: ReactNode;
  onClosed?: () => void;
};

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

function originRadius(origin: HTMLElement) {
  const card = origin.querySelector<HTMLElement>(".cg-card") ?? origin;
  return getComputedStyle(card).borderRadius;
}

/**
 * Expand (spec §7): Flip from the active card to the full shell, then reveal the body; reverse on close.
 * Uses Flip.fit so the origin can live inside the 3D orbit (bounds are measured, never re-parented).
 */
export function ExpandShell({
  open,
  onClose,
  children = EXPAND_DEFAULTS.placeholder,
  scroll = EXPAND_DEFAULTS.scroll,
  flipDurationMs = EXPAND_DEFAULTS.flipDurationMs,
  flipEase = EXPAND_DEFAULTS.flipEase,
  originElement,
  label,
  media,
  onClosed,
}: ExpandShellProps) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onCloseRef.current = onClose;
    onClosedRef.current = onClosed;
  });

  useGSAP(
    () => {
      const panel = panelRef.current;
      const body = bodyRef.current;
      if (!mounted || !panel || !body) return;
      const duration = Math.max(0, flipDurationMs) / 1000;
      const origin = originElement?.isConnected ? originElement : null;

      if (open) {
        gsap.set(body, { autoAlpha: 0 });
        const reveal = () => {
          gsap.to(body, { autoAlpha: 1, duration: duration * 0.5 });
          closeRef.current?.focus({ preventScroll: true });
        };
        if (origin) {
          Flip.fit(panel, origin, {
            duration,
            ease: flipEase,
            runBackwards: true,
            borderRadius: originRadius(origin),
            onComplete: reveal,
          });
        } else {
          gsap.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration, ease: flipEase, onComplete: reveal });
        }
        return;
      }

      const finish = () => {
        setMounted(false);
        origin?.focus({ preventScroll: true });
        onClosedRef.current?.();
      };
      gsap.to(body, { autoAlpha: 0, duration: duration * 0.3 });
      if (origin) {
        Flip.fit(panel, origin, { duration, ease: flipEase, borderRadius: originRadius(origin), onComplete: finish });
      } else {
        gsap.to(panel, { autoAlpha: 0, duration, ease: flipEase, onComplete: finish });
      }
    },
    { dependencies: [open, mounted], revertOnUpdate: true },
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
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-scroll={scroll}
      data-state={open ? "open" : "closing"}
    >
      <button ref={closeRef} type="button" className="cg-expand-close" aria-label="Close" onClick={onClose}>
        <span aria-hidden>×</span>
      </button>
      <div ref={bodyRef} className="cg-expand-scroll" tabIndex={0}>
        {media}
        <div className="cg-expand-body">{children}</div>
      </div>
    </div>
  );
}
