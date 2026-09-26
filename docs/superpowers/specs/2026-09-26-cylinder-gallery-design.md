# Cylinder Gallery — Implementation Design

Source of truth for product rules: `docs/spec/vertical-cylinder-gallery.md` (Draft v0.2). This doc only records
implementation structure. Where the spec is silent, the gap is labelled `[OPEN]` or `[ASSUMPTION]` and exposed as a prop
instead of being decided silently.

## Units

| Unit | File | Purpose | Depends on |
|---|---|---|---|
| Types | `src/lib/gallery/types.ts` | `GalleryItem`, `MediaAsset`, `Aspect` | — |
| Defaults | `src/lib/gallery/defaults.ts` | Every §5 default + implementation knob, one place | — |
| Orbit math | `src/lib/gallery/orbit.ts` | Pure: wrap, spacing, guards, auto radius solve, per-slot pose | — |
| Stepper | `src/lib/gallery/stepper.ts` | Pure: wheel + swipe → single ±1 step (debounced) | — |
| Aspect | `src/lib/gallery/aspect.ts` | Pure: parse/fallback aspect, fit media box inside fixed shell | — |
| Keyboard | `src/lib/gallery/keyboard.ts` | Pure: key → action per §6 | — |
| Orbit scene | `src/lib/gallery/orbitScene.ts` | Three.js camera/Object3D → CSS `matrix3d` on DOM cards (CSS3DRenderer pattern, s.page) | three (lazy) |
| CylinderGallery | `src/components/gallery/CylinderGallery.tsx` | Orbit + wheel/touch + snap tween + click routing | orbit, stepper, orbitScene, gsap |
| GalleryItemCard | `src/components/gallery/GalleryItemCard.tsx` | Fixed outer shell; hosts media stage | ActiveMediaStage |
| ActiveMediaStage | `src/components/gallery/ActiveMediaStage.tsx` | 3.5s cycle, bounce (scale), Flip aspect morph inside fixed shell | gsap, Flip, aspect |
| ExpandShell | `src/components/gallery/ExpandShell.tsx` | Flip open/close, focus trap, vertical scroll body | gsap, Flip |
| Gallery | `src/components/gallery/Gallery.tsx` | Composition (spec "GalleryPage"): expand state, frozen media, Space/Enter/Esc, viewport pause | all above |
| Sanity | `src/sanity/**`, `sanity.config.ts` | Schema, GROQ, server fetch with mock fallback, embedded Studio at `/studio` | next-sanity, mux input |
| Dev panel | `src/app/dev/**`, `src/components/dev/**` | Live knobs for every §5 prop | Gallery |

## Key decisions

- **Cylinder = mini CSS3DRenderer.** World units = CSS px. Camera at `z = d` where `d = (H/2)/tan(fov/2)`, so the
  center card plane renders 1:1. Cylinder axis is X; card at relative angle `θ` sits at
  `(0, -R·sinθ, -R + R·cosθ)` with `rotation.x = θ·tiltMultiplier`. Position `pos` is an unbounded float; item index is
  `mod(slot, N)` → infinite wrap at any N. Only slots `round(pos)-2 … +2` are in the DOM.
- **Auto radius.** Binary search on `R` so the neighbor card's projected visible fraction inside the viewport equals
  `peekRatio`. Perspective-correct, monotonic, bounded → survives any prop combo.
- **Spacing guard.** `M = max(N, max(5, minVirtualSlots))`, `α = 2π/M` (≤ 72°, neighbors stay front-facing).
  Explicit `itemAngularSpacing` is clamped to `(0, π/2)`.
- **Snap.** One GSAP tween on a `{pos}` proxy (`snapDurationMs`, `snapEase`), render on update only. No RAF loop at rest.
- **Gestures.** Wheel: accumulate to threshold → step; disarm until wheel idle gap (kills trackpad momentum); ignore while
  snapping/locked. Touch: pointer swipe with distance/velocity threshold; finger up = next.
- **Media freeze.** Each card always hosts one `ActiveMediaStage` instance; only the settled center is `active`. Keeps the
  same `<video>` element so leaving center truly keeps the last frame (spec §6).
- **Zero CLS.** Card shell size comes from CSS tokens only. Media frame is `position:absolute; inset:0; margin:auto`
  with width/height from `fitAspect()` — Flip animates that frame. Bounce is `scale` on an inner node (different node
  from Flip target → no dual-driving).
- **Expand.** Open: `Flip.getState(card)` → mount panel with same `data-flip-id` → `Flip.from(state, {targets: panel})`.
  Close: `Flip.fit(panel, card)` then unmount. Cylinder `autoAlpha` 0/1 + `locked`.
- **Timer restart.** Stage starts a fresh `intervalMs` delayed call every time it transitions to running
  (settle, collapse, Space resume). In-flight bounce/morph tweens pause/resume with Space.
- **Data.** Server component fetches Sanity when `NEXT_PUBLIC_SANITY_PROJECT_ID` is set; otherwise (or on error) mock
  items. Mock media served by a route handler that renders labelled SVGs per aspect.

## Spec gaps surfaced (not decided silently)

- `[OPEN]` Mobile collapse affordance: spec gives Esc only. Minimal `×` button (aria-label "Close") ships so touch users
  are not trapped; needs product sign-off.
- `[OPEN]` Item ordering: spec §8 has no order field; GROQ orders by `_createdAt asc`.
- `[OPEN]` Empty-state + media-error copy (spec §12.1): components render no copy, only structure.
- `[OPEN]` Captions (spec §12.3), expand body schema (§12.2), token values per breakpoint (§12.4).

## Testing

- Vitest on pure modules (orbit, stepper, aspect, keyboard, Sanity mapping, mock data).
- Visual/interaction verification in browser at 1512px and 393px; CLS measured via `PerformanceObserver`.
