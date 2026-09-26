"use client";

import { type RefObject, useEffect, useRef } from "react";

export type AboutCta = { label: string; href?: string };

export type AboutSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Focus returns here on close (the About button). */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** CTA destinations are [OPEN]; without `href` they render as buttons. */
  ctas?: AboutCta[];
};

const DEFAULT_CTAS: AboutCta[] = [{ label: "See what’s costing you" }, { label: "Book a call" }];

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

function Cta({ cta }: { cta: AboutCta }) {
  const content = (
    <>
      <span>{cta.label}</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- static Figma icon, fixed 24px box */}
      <img src="/icons/add-circle.svg" width={24} height={24} alt="" />
    </>
  );
  return cta.href ? (
    <a className="site-cta cg-glass cg-pressable" href={cta.href}>
      {content}
    </a>
  ) : (
    <button type="button" className="site-cta cg-glass cg-pressable">
      {content}
    </button>
  );
}

/** Figma "About (bottom-sheet)" (node 591:948). */
export function AboutSheet({ open, onClose, returnFocusRef, ctas = DEFAULT_CTAS }: AboutSheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    sheet?.focus({ preventScroll: true });
    const returnTo = returnFocusRef?.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const focusables = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const inside = sheet.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      returnTo?.focus({ preventScroll: true });
    };
  }, [open, returnFocusRef]);

  return (
    <div className="site-sheet-root" data-open={open}>
      <div className="site-sheet-backdrop" aria-hidden onClick={onClose} />
      <section
        ref={sheetRef}
        id="about-sheet"
        className="site-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="About"
        tabIndex={-1}
        inert={!open}
        data-node-id="578:16295"
      >
        <div className="site-sheet-content">
          {/* eslint-disable-next-line @next/next/no-img-element -- static Figma logo mark, fixed 32×15 */}
          <img src="/brand/logo-mark.svg" width={32} height={15} alt="Polis, Works" />
          <div className="site-sheet-text">
            <p>
              Polis, <span className="site-literature">Works</span> is a design service that makes your business look as
              capable as it actually is, so you stop losing to competitors who just look more legitimate.
            </p>
            <p>
              Most of the time it&apos;s not your product or your team. It&apos;s the first look someone gets before they
              decide you&apos;re worth trusting.
            </p>
            <p>Two minutes, a few questions, and you&apos;ll know what&apos;s costing you and how to fix it.</p>
          </div>
          <div className="site-sheet-ctas">
            {ctas.map((cta) => (
              <Cta key={cta.label} cta={cta} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
