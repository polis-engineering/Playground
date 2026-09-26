# Cylinder Gallery Implementation Plan

> **For agentic workers:** executed inline (single session) task-by-task. Steps use checkbox syntax.

**Goal:** Working vertical slice of the v0.2 cylinder gallery with mock data, Sanity schema, docs and a `/dev` knob panel.

**Architecture:** See `docs/superpowers/specs/2026-09-26-cylinder-gallery-design.md`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Three.js (lazy), GSAP 3 + Flip + @gsap/react, Sanity 6 +
sanity-plugin-mux-input, hls.js, Vitest.

## Global Constraints

- Exactly 3 visible slots, `peekRatio` default `0.33`, infinite wrap (`loop` default `true`).
- Wheel/swipe down → next item moves toward top.
- `intervalMs` default `3500`; bounce default `{ duration: 0.45, ease: "back.out(1.7)" }`; `snapDurationMs` `620`;
  `snapEase` `"power4.out"`; `flipDurationMs` `500`; `minVirtualSlots` `12`.
- Expand body copy exactly `Soon, check back later`.
- Do NOT honor `prefers-reduced-motion`.
- No CSS scroll-snap / Embla / Swiper / Lenis. No Motion `layoutId` on Flip nodes.
- Every layout/3D/timing number is a prop with a default in `src/lib/gallery/defaults.ts`.

---

### Task 1: Scaffold

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`,
`src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `.env.example`, `vercel.json` (none needed if defaults work).

- [ ] Install deps with pnpm; add scripts `dev`, `build`, `start`, `lint`, `test`.
- [ ] Placeholder page renders; `pnpm lint && pnpm test && pnpm build` pass.
- [ ] Commit `chore: scaffold Next.js app with vitest`.

### Task 2: Types, aspect, mock data, Sanity

**Files:** `src/lib/gallery/{types,aspect,defaults}.ts`, `src/lib/gallery/mock.ts`, `src/app/mock-media/[item]/[asset]/[aspect]/route.ts`,
`src/sanity/schemaTypes/{galleryItem,mediaAsset,index}.ts`, `src/sanity/{env,client,queries,mapGallery,getGalleryItems}.ts`,
`sanity.config.ts`, `sanity.cli.ts`, `src/app/studio/[[...tool]]/page.tsx`, tests in `tests/`.

**Interfaces (produces):**
- `type Aspect = "16:9" | "4:3" | "1:1"`
- `parseAspect(value: unknown, log?: (msg: string) => void): Aspect` → falls back to `"16:9"` and logs.
- `aspectRatio(a: Aspect): number`
- `fitAspect(shellW: number, shellH: number, a: Aspect): { width: number; height: number }`
- `createMockItems(count?: number): GalleryItem[]` (default 3, media 3–8 each)
- `mapGalleryItems(raw: unknown[]): GalleryItem[]`
- `getGalleryItems(): Promise<{ items: GalleryItem[]; source: "sanity" | "mock" }>`

Tests (write first, watch fail):
- `parseAspect` accepts the 3 values; unknown → `"16:9"` + log called once.
- `fitAspect` letterboxes wide media in square shell; pillarboxes square media in wide shell; never exceeds shell.
- `createMockItems()` returns 3 items, each 3–8 media, unique `_key`s, video assets have posters.
- `mapGalleryItems` maps GROQ rows; drops media rows missing required data; invalid aspect → `"16:9"`.

### Task 3: Orbit math + stepper + keyboard + CylinderGallery

**Interfaces:**
- `mod(n: number, m: number): number`
- `resolveSpacing({ itemCount, minVirtualSlots, itemAngularSpacing? }): number`
- `resolveFovDeg(fov: "auto" | number): number`; `perspectiveDistance(viewportH, fovDeg): number`
- `solveAutoRadius({ viewportHeight, cardHeight, spacing, perspective, peekRatio, tiltMultiplier }): number`
- `neighborVisibleFraction({...same, radius}): number`
- `slotPose(offset, { radius, spacing, tiltTopMultiplier, tiltBottomMultiplier }): { y; z; rotationX; angle }`
- `createStepper(opts): { wheel(deltaY, now, busy): -1|0|1; swipe(dy, dtMs, busy): -1|0|1; reset() }`
- `keyToAction(key, { expanded }): "next"|"prev"|"expand"|"collapse"|"togglePause"|null`

Tests: wrap with negative indexes; spacing guard for N=1..40 and overrides; radius solve hits `peekRatio` ±0.5% for
N=3/12/40 and several viewports; wheel threshold, idle re-arm, busy ignore; swipe direction (finger up → +1);
keyboard map incl. expanded state.

### Task 4: ActiveMediaStage

- Fixed shell, absolute frame sized by `fitAspect`, Flip on frame, scale bounce on inner node, `gsap.delayedCall`
  timer, pause/resume, `onIndexChange`, `frozenFrame`, error fallback + skip timeout, video via hls.js/native.

### Task 5: ExpandShell + Gallery composition

- Flip open/close, `autoAlpha` cylinder, `locked`, focus trap + restore, Esc, body copy, vertical scroll only.
- Gallery: Enter/Esc/Space/Arrows, IntersectionObserver + `visibilitychange` pause, aria-live title.

### Task 6: `/dev` panel + `docs/props.md`

- Controls for every §5 prop + implementation knobs, event log, copy-JSON.

### Task 7: README + acceptance checklist

### Task 8: Verify — lint, test, build, visual at 1512 and 393, CLS observer; PR; Vercel preview attempt.
