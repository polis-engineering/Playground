# cylinder-gallery

Vertical snap cylinder gallery for Polis — Next.js App Router + Sanity (Mux video) + Three.js + GSAP.

Exactly three slots are visible: the center card face-on and cycling media, the neighbours peeking ~33 % from the top and
bottom on a Three.js Y-orbit. Scroll down / swipe up / `ArrowDown` steps to the next item, wrapping forever. Click or
`Enter` expands the center card in place.

- Spec (source of truth): [`docs/spec/vertical-cylinder-gallery.md`](docs/spec/vertical-cylinder-gallery.md) — Draft v0.2
- Props: [`docs/props.md`](docs/props.md) — every §5 prop, default and tag
- Knobs: **`/dev`** — live panel for every prop, event log, "Copy props JSON"
- Studio: **`/studio`** — embedded Sanity Studio (needs a project id)

## Setup

Requirements: Node ≥ 22, pnpm 11 (`corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:3000  (mock data when no Sanity env)
pnpm test         # vitest — orbit math, gestures, keyboard, data mapping, orbit scene
pnpm lint
pnpm build
```

### Environment

Copy `.env.example` to `.env.local`. With `NEXT_PUBLIC_SANITY_PROJECT_ID` empty the app runs entirely on mock data
(labelled SVG frames from `/mock-media/*` and one sample clip), so the UI works without any secrets.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | for CMS | Empty → mock data; `/studio` shows setup instructions. |
| `NEXT_PUBLIC_SANITY_DATASET` | no | Default `production`. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | no | Default `2026-09-01`. |
| `SANITY_API_READ_TOKEN` | private datasets only | Server-side only. |

Mux credentials are **not** env vars: `sanity-plugin-mux-input` asks for the Mux token id/secret inside Studio and stores
them in the dataset.

### Sanity + Mux

1. Create/choose a Sanity project, set the env vars above, and add `http://localhost:3000` (and the Vercel URL) to the
   project's CORS origins with credentials.
2. Open `/studio`, enter Mux API credentials when the video field asks.
3. Create `galleryItem` documents: `title` (a11y/CMS only, not rendered), `slug`, `media` (3–8 `mediaAsset`).
4. Each `mediaAsset`: `kind` (image/video), **`aspect` (required: 16:9 / 4:3 / 1:1)**, `image` or `video` (Mux),
   `poster` (required for video), `alt`. Studio warns when an image's pixels suggest a different aspect (hint only).

The page fetches on the server (`src/sanity/getGalleryItems.ts`, ISR 60 s) and hands plain data to the client island.
Fetch errors fall back to mock data; an empty dataset renders the empty state.

## Architecture

```
src/
  app/page.tsx                 server: getGalleryItems() → <Gallery>
  app/dev/                     knob panel
  app/studio/[[...tool]]/      embedded Studio
  app/mock-media/…/route.ts    mock SVG frames
  components/gallery/
    Gallery.tsx                spec "GalleryPage": expand state, frozen frames, keys, pause sources, aria-live
    CylinderGallery.tsx        orbit + wheel/swipe stepper + GSAP snap + click routing
    GalleryItemCard.tsx        fixed outer shell
    ActiveMediaStage.tsx       3.5 s cycle, Flip aspect morph, scale bounce
    ExpandShell.tsx            Flip open/close, focus trap, Esc
  lib/gallery/
    defaults.ts                every default (§5) + [IMPL] knobs
    orbit.ts                   pure orbit math (auto radius solver, poses, guards)
    orbitScene.ts              Three.js camera/Object3D → CSS matrix3d (CSS3DRenderer pattern)
    stepper.ts                 wheel/swipe → single ±1 step
    keyboard.ts, aspect.ts, props.ts, mock.ts, types.ts
  sanity/                      schema, GROQ, mapping, server fetch
```

Key decisions (see [`docs/superpowers/specs/2026-09-26-cylinder-gallery-design.md`](docs/superpowers/specs/2026-09-26-cylinder-gallery-design.md)):

- **Cylinder:** Three.js `PerspectiveCamera` + `Object3D` compute poses; React-owned DOM cards get them as CSS `matrix3d`
  (s.page / CSS3DRenderer pattern). Three.js is a lazy chunk. No scroll-snap / Embla / Swiper / Lenis.
- **Auto radius:** perspective-correct binary search so the neighbour's projected visible fraction equals `peekRatio` for
  any viewport, card size, item count or FOV.
- **Zero CLS:** the card shell size comes only from tokens; the media frame is anchored at the shell center and centered
  by transform, so the Flip size morph never moves its layout start point; bounce is `scale` on a separate inner node
  (no Flip + Motion dual-driving).
- **Expand:** `Flip.fit(panel, card, { runBackwards })` open, `Flip.fit(panel, card)` close — works although the card sits
  inside the 3D orbit.
- **No `prefers-reduced-motion` handling** — by product decision (spec §1, §9).

## Vercel

Vercel-ready with defaults (framework auto-detected, pnpm via `packageManager`). A Vercel project **`cylinder-gallery`**
exists in team `polis-engineerings-projects`; it was deployed from this branch through the Vercel API and is **not yet
Git-connected**. After the repo moves (below): Project → Settings → Git → connect `polis-engineering/cylinder-gallery`
so every push gets a preview. Add the Sanity env vars in Project → Settings → Environment Variables.

## Acceptance checklist (spec §11)

Verified with a scripted headless-Chrome run against the production build (local and Vercel) at desktop 1512×982 and
mobile 393×852 (touch), plus unit tests.

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Exactly 3 visible; top & bottom ≈33 % peek at all breakpoints | ✅ | Measured 0.330 / 1.000 / 0.330 at 1512 and 393; 0.500 when `peekRatio=0.5` at 3 / 40 / 1 items |
| 2 | Infinite wrap with 3+ items | ✅ | ArrowUp from 0 → 2; wheel/swipe forward wraps |
| 3 | Wheel, trackpad, touch, ArrowUp/Down step one item, relaxed snap | ✅ / ◐ | Wheel, touch swipe, arrows verified; trackpad momentum handled by idle re-arm (unit tested) — real-trackpad feel not device-tested |
| 4 | Media advances every 3.5 s with bounce; 16:9 / 4:3 / 1:1 morph; zero outer layout shift | ✅ | Aspect 16:9 → 4:3, card rect unchanged, **CLS 0** (PerformanceObserver) |
| 5 | Leaving center freezes last frame; Space pauses; leaving viewport pauses | ✅ / ◐ | Space verified; frozen frame restored after expand; off-viewport pause implemented (IntersectionObserver + `visibilitychange`), not script-verified |
| 6 | Enter / click center expands; cylinder hidden + locked; Esc collapses; same item + frozen media; timer restarts fresh | ✅ | Arrows ignored while expanded; same item + media index after Esc; focus returns to card |
| 7 | Body shows "Soon, check back later"; vertical scroll only inside expand | ✅ | Dialog text verified; `overflow-y: auto` only on the shell |
| 8 | All §5 props overridable without breaking orbit math | ✅ | 54 solver cases + guard tests; `/dev` knob sweep |
| 9 | CWV: no CLS from cycle; transform-only bounce; Sanity CDN + sized URLs | ✅ / ◐ | CLS 0; bounce is `scale`; `srcset` with `?w=…&auto=format` (unit tested). Lighthouse not run yet |
| 10 | Chrome, Safari, Firefox, Edge — desktop + mobile | ◐ | Chrome (desktop + mobile emulation) only; Safari/iOS, Firefox, Edge pending |

## `[OPEN]` items

From the spec (§12):

1. Empty-state and media-error copy — `GalleryEmpty` renders no copy (pass `emptyState`); failed media shows poster or a
   solid fill.
2. Expand body schema (phase 2) — placeholder string only.
3. Video captions / transcripts.
4. Exact token values per breakpoint — defaults in `CARD_DEFAULTS` / `EXPAND_DEFAULTS`, all exposed.

Spec gaps surfaced during the build (implemented minimally, need sign-off):

5. **Mobile collapse:** the spec lists only Esc. A minimal `×` button (aria-label "Close") ships so touch users are not
   trapped in the expanded state.
6. **Item order:** §8 has no order field → GROQ orders by `_createdAt asc`.
7. **Keyboard scope:** keys are handled window-wide while the gallery is mounted (skipping form fields and
   `[data-gallery-ignore-keys]`).
8. **Space resume** restarts the 3.5 s timer fresh (the spec defines fresh restart only for collapse); in-flight
   bounce/morph tweens pause and resume.
9. **Aspect hint:** Studio's auto-detect warning covers images only (Mux `aspect_ratio` not checked).
10. [IMPL] defaults not in the spec: `bounce.fromScale 0.94`, `aspectMorph 0.45 s power3.inOut`, auto FOV 30°, gesture
    thresholds, expand shell tokens.

## What's left

- Create `polis-engineering/cylinder-gallery` and move this history there (below); connect the Vercel project to it.
- Sanity project id + CORS, Mux credentials in Studio, real content.
- Cross-browser/device QA (iOS Safari, Firefox, Edge) and real-trackpad tuning of the gesture knobs.
- Lighthouse pass; design tokens per breakpoint; captions; phase-2 expand content.

## Moving to `polis-engineering/cylinder-gallery`

This history was bootstrapped on orphan branches of `polis-engineering/Playground` (`polis/cylinder-gallery-main-b9d6`
= repo root commit, `polis/cylinder-gallery-slice-b9d6` = this work). It shares no commits with Playground.

```bash
gh repo create polis-engineering/cylinder-gallery --private \
  --description "Vertical snap cylinder gallery (Next.js + Sanity + Three.js + GSAP)"
git clone --single-branch -b polis/cylinder-gallery-slice-b9d6 https://github.com/polis-engineering/Playground cylinder-gallery
cd cylinder-gallery
git fetch origin polis/cylinder-gallery-main-b9d6
git remote add gallery https://github.com/polis-engineering/cylinder-gallery.git
git push gallery origin/polis/cylinder-gallery-main-b9d6:refs/heads/main
git push gallery HEAD:refs/heads/feat/vertical-slice
# open a PR feat/vertical-slice → main, then delete the two Playground branches
```
