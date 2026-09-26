# agency-site

Polis, Works agency site — Next.js App Router + Sanity (Mux video) + Three.js + GSAP. The home page is the vertical snap
cylinder gallery.

Exactly three slots are visible: the center card face-on and cycling media, the neighbours peeking ~33 % from the top and
bottom on a concave Three.js Y-orbit (they curve toward you and face the center). Scroll down / swipe up / `ArrowDown`
steps to the next item, wrapping forever. Click or `Enter` expands the center card in place; the glass **About** pill opens
the About bottom sheet.

- Design: Figma [Polis--Works](https://www.figma.com/design/Ra39Tjy7Kcf74D4P7EmmJP/Polis--Works) — `591:949` Desktop home
  page (snap poses A/B/C), `591:948` About (bottom-sheet). Tokens: [`src/app/tokens.css`](src/app/tokens.css).

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
| `NEXT_PUBLIC_MOCK_VIDEO_BASE_URL` | no | Where `clip-01.mp4` … `clip-05.mp4` (Figma "Alter Start" videos) live. Unset → the Figma poster frames are shown as stills. |

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
Mock data is used **only** when Sanity is not configured. With Sanity configured, fetch errors propagate: Next keeps
serving the last good ISR page (a build fails loudly) instead of publishing placeholders. An empty dataset renders the
empty state.

## Design source (Figma)

- **Frames:** Desktop home page (`551:11691` snap pose A, `576:13836` B, `576:14048` C) and About bottom sheet
  (`578:16295`). DOM keeps `data-node-id` on the page, logo, About pill and sheet.
- **Tokens:** every Figma variable used by those frames is a CSS custom property in `src/app/tokens.css`
  (`--labels-primary`, `--material-ultra-thin`, `--radius-4xl`, `--spacing-2xl`, `--shadow-content-well`, …).
  `Border/Primary` is a 3px inside gradient stroke with Linear Dodge → `--border-primary` + `mix-blend-mode: plus-lighter`.
- **Assets:** `public/brand/logo.svg`, `public/brand/logo-mark.svg`, `public/icons/{pause,close,add-circle}.svg` and the five
  "Alter Start" clip posters `public/media/alter-start/clip-0N-poster.webp` (exported from the Figma video fills, WebP
  q90). The clip **videos** themselves cannot be exported through the Figma MCP — see `NEXT_PUBLIC_MOCK_VIDEO_BASE_URL`.
- **Fonts:** NAP MD Grotesk and Times New Literature are licensed; `tokens.css` uses them via `local()` when installed
  and falls back to Inter (self-hosted by `next/font`) / Times. Drop the licensed woff2 files in `public/fonts` and add the
  `url()` noted in `tokens.css`.
- **Motion:** the media cycle reproduces `get_motion_context` of the stage `570:13252` (spring + exit bezier + keyframe
  geometry), see `docs/props.md` → ActiveMediaStage.

## Architecture

```
src/
  app/page.tsx                 server: getGalleryItems() → <HomePage>
  app/tokens.css               Figma variables as CSS custom properties
  app/dev/                     knob panel
  app/studio/[[...tool]]/      embedded Studio
  app/mock-media/…/route.ts    mock SVG frames
  components/site/
    HomePage.tsx               Figma home: gallery + logo + glass About pill
    AboutSheet.tsx             Figma About bottom sheet
  components/gallery/
    Gallery.tsx                spec "GalleryPage": expand state, frozen frames, keys, pause sources, aria-live
    CylinderGallery.tsx        orbit + wheel/swipe stepper + GSAP snap + click routing
    GalleryItemCard.tsx        transparent shell (orbit slot)
    ActiveMediaStage.tsx       annex cycle: spring in, hold, compress, hard cut; stacked clips
    MediaContext.tsx           glass tag + pause button
    ExpandShell.tsx            Flip open/close, media hide, focus trap, Esc
  lib/gallery/
    defaults.ts                every default (§5) + [IMPL] knobs
    orbit.ts                   pure orbit math (auto radius solver, poses, guards)
    orbitScene.ts              Three.js camera/Object3D → per-card CSS matrix3d (CSS3DRenderer projection)
    easing.ts                  Figma spring + cubic-bezier eases
    morph.ts                   annex handoff geometry
    stepper.ts                 wheel/swipe → single ±1 step
    keyboard.ts, aspect.ts, props.ts, mock.ts, types.ts
  sanity/                      schema, GROQ, mapping, server fetch
```

Key decisions (see [`docs/superpowers/specs/2026-09-26-cylinder-gallery-design.md`](docs/superpowers/specs/2026-09-26-cylinder-gallery-design.md)):

- **Cylinder:** Three.js `PerspectiveCamera` + `Object3D` compute poses; React-owned DOM cards get them as CSS `matrix3d`
  (s.page / CSS3DRenderer projection). **Concave:** neighbours curve toward the viewer and face the center. Each card
  carries the whole projection in a flat container — a shared `preserve-3d` camera made Chrome's depth sort clip the
  center card's shadow against the tilted neighbours. Three.js is a lazy chunk. No scroll-snap / Embla / Swiper / Lenis.
- **Auto radius:** perspective-correct search so the neighbour's projected visible fraction equals `peekRatio`, never
  back-facing, past the near plane, or covering the center card (reports `peekReachable: false` otherwise).
- **Transparent placeholder:** the orbit slot is invisible; the visible card is the media box, whose bounds always equal the
  current media (radius 32, Figma shadow + gradient border, glass Media context anchored bottom-right).
- **Media choreography (annex):** layout-dimension spring in (400ms), hold, 150ms compress into the next clip's handoff box,
  hard cut. **Zero CLS:** the box is anchored at the slot center and centered by transform, and the glass controls are
  placed by transform in container units, so nothing outside moves its layout start point.
- **Expand:** `Flip.fit(panel, mediaBox, { runBackwards })` open while the media fades + blurs out (empty placeholder),
  `Flip.fit(panel, mediaBox)` close while it fades back in; interruptions continue from the current geometry.
- **No `prefers-reduced-motion` handling** — by product decision (spec §1, §9).

## Motion pass (Emil design-engineering)

| Before | After | Why |
| --- | --- | --- |
| Expand open `500ms power3.inOut` | `400ms cubic-bezier(0.32, 0.72, 0, 1)` | Modal range; a strong ease-out answers the click immediately (ease-in-out starts slow) |
| Expand close = open (500ms) | `300ms cubic-bezier(0.77, 0, 0.175, 1)` | Exit faster than enter; shrinking on screen is a morph → ease-in-out |
| Expanded view kept the card media | Media `opacity → 0` + `blur(0 → 10px)`, 200ms ease-out, as the placeholder grows | Empty placeholder per request; blur fuses the two states so it reads as one object emptying |
| Copy + media faded together (`autoAlpha`, 0.5× flip) | Copy `opacity` + `y 8px → 0`, 200ms ease-out after the flip; 120ms out | Content arrives once the surface settles; exits snappy |
| Close button faded with `autoAlpha` | `opacity` only | autoAlpha's first frame sets `visibility: hidden` and drops keyboard focus |
| Cylinder fade 500ms both ways | Out 200ms / in 300ms, ease-out | Neighbours get out of the way fast, come back while the card lands |
| Media cycle: Flip width morph 450ms `power3.inOut` + `back.out(1.7)` scale pop | Figma spring 400ms (width/height) + 150ms `cubic-bezier(.5, 0, 1, 1)` compress + hard cut | Annex reference; one bounce instead of two stacked; layout dims so the aspect visibly morphs |
| Buttons had no press state; hover always on | `.cg-pressable`: `:active { scale(0.97) }` 160ms ease-out; hover only under `(hover: hover) and (pointer: fine)` | Pressables must answer; no sticky hover on touch |
| — (new) About sheet | CSS transition `transform 400ms var(--ease-drawer)` in, `250ms var(--ease-out)` out | Drawer curve; CSS transitions retarget when toggled mid-way; faster exit |
| Logo / About stayed over the expanded card | Fade out 200ms ease-out, pointer-events off | The placeholder owns the screen |
| Snap `620ms power4.out` | unchanged | Spec [ASSUMPTION] (s.page feel); a spatial carousel move, not a micro-interaction |
| Arrow-key snaps animate | unchanged — flagged | Emil: don't animate keyboard actions; spec §6 requires the same relaxed snap |
| `prefers-reduced-motion` ignored | unchanged — flagged | Product decision (spec [FACT]) overrides the guideline |
| Skeleton shimmer 1.4s linear | unchanged | Constant motion → linear |

## Vercel

Preview: **https://cylinder-gallery-azure.vercel.app** (public production alias kept through the rename;
`agency-site.vercel.app` belongs to another account).

Vercel-ready with defaults (framework auto-detected, pnpm via `packageManager`). A Vercel project **`agency-site`**
(renamed from `cylinder-gallery`) exists in team `polis-engineerings-projects`; it was deployed from this branch through the Vercel API and is **not yet
Git-connected**. After the repo moves (below): Project → Settings → Git → connect `polis-engineering/agency-site`
so every push gets a preview. Add the Sanity env vars in Project → Settings → Environment Variables.

## Acceptance checklist (spec §11)

Verified with a scripted headless-Chrome run against the production build (local and Vercel) at desktop 1512×982 and
mobile 393×852 (touch), plus unit tests.

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Exactly 3 visible; top & bottom ≈33 % peek at all breakpoints | ✅ | Measured 0.330 / 1.000 / 0.330 at 1512 and 393; 0.500 when `peekRatio=0.5` at 3 / 40 / 1 items. Figma pose A geometry matched: center 819×461 at (346, 261), neighbours 498 tall, 164 / 818 px edges (Figma 165 / 816) |
| 2 | Infinite wrap with 3+ items | ✅ | ArrowUp from 0 → 2; wheel/swipe forward wraps |
| 3 | Wheel, trackpad, touch, ArrowUp/Down step one item, relaxed snap | ✅ / ◐ | Wheel, touch swipe, arrows verified; trackpad momentum handled by idle re-arm (unit tested) — real-trackpad feel not device-tested |
| 4 | Media advances every 3.5 s with bounce; 16:9 / 4:3 / 1:1 morph; zero outer layout shift | ✅ | Frame trace: hold 819.2×460.8 → 150ms compress to 541×304 → cut → spring to 615×461 (overshoot 620×465) as in Figma; slot rect unchanged, **CLS 0** |
| 5 | Leaving center freezes last frame; Space pauses; leaving viewport pauses | ✅ / ◐ | Space verified; frozen frame restored after expand; off-viewport pause implemented (IntersectionObserver + `visibilitychange`), not script-verified |
| 6 | Enter / click center expands; cylinder hidden + locked; Esc collapses; same item + frozen media; timer restarts fresh | ✅ | Arrows ignored while expanded; same item + media index after Esc; focus returns to card |
| 7 | Body shows "Soon, check back later"; vertical scroll only inside expand | ✅ | Dialog text verified; `overflow-y: auto` only on the shell |
| 8 | All §5 props overridable without breaking orbit math | ✅ / ◐ | Solver cases + a 216-case FOV × `minVirtualSlots` grid: never back-facing, past the near plane or covering the center; `/dev` knob sweep. Wide-FOV combos that cannot reach the peek report `peekReachable: false` (envelope in `docs/props.md`) |
| 9 | CWV: no CLS from cycle; transform-only bounce; Sanity CDN + sized URLs | ✅ / ◐ | CLS 0 (the annex requires layout-dimension morphs; they are laid out so no shift is recorded); `srcset` with `?w=…&auto=format` (unit tested). Lighthouse not run yet |
| 10 | Chrome, Safari, Firefox, Edge — desktop + mobile | ◐ | Chrome (desktop + mobile emulation) only; Safari/iOS, Firefox, Edge pending |

## `[OPEN]` items

From the spec (§12):

1. Empty-state and media-error copy — `GalleryEmpty` renders no copy (pass `emptyState`); failed media shows poster or a
   solid fill.
2. Expand body schema (phase 2) — placeholder string only.
3. Video captions / transcripts.
4. Exact token values per breakpoint — defaults in `CARD_DEFAULTS` / `EXPAND_DEFAULTS`, all exposed.

Spec gaps surfaced during the build (implemented minimally, need sign-off):

5. **Mobile collapse:** the spec lists only Esc. A glass close button (Figma `close` icon, aria-label "Close") ships so
   touch users are not trapped in the expanded state.
6. **Item order:** §8 has no order field → GROQ orders by `_createdAt asc`.
7. **Keyboard scope:** keys act only when focus is on the page body or inside the gallery (other focused controls keep
   native Enter/Space; form fields and `[data-gallery-ignore-keys]` are skipped).
8. **Pause:** Space and the glass pause button pause the timeline and active video in place and resume where they stopped;
   collapse restarts the 3.5 s interval fresh (spec). Figma has no play icon — the pause icon stays, with `aria-pressed`.
9. **Aspect hint:** Studio's auto-detect warning covers images only (Mux `aspect_ratio` not checked).
10. [IMPL] defaults not in the spec: auto FOV 27° (Figma-matched), gesture thresholds, expand geometry and motion timings,
    off-viewport threshold 0.25, near-plane fraction 0.8.
11. **Fetch errors (§10 has no state for it):** with Sanity configured, errors propagate (last good ISR page stays) —
    never mock content in production.
12. **Copy outside the spec:** `ariaLabel="Gallery"`, the × `aria-label="Close"`, and the page `<title>`/description are
    placeholders pending product copy.
13. **Expanded video** shows its poster (a new element), not the frozen video frame of the card.
14. **GSAP contexts:** spec §13 asks for one context per gallery; each component uses its own `useGSAP` context (all
    reverted on unmount) and the snap tween is killed on unmount.
15. **Spec deviations requested after v0.2:** concave orbit (neighbours toward the viewer), transparent placeholder whose
    bounds follow the media, annex media choreography instead of Flip + scale pop, expanded view hides the media.
16. **Alter Start videos:** the five Figma video fills (hashes in the annex) cannot be exported via the Figma MCP. Posters
    ship as stills; host the MP4s and set `NEXT_PUBLIC_MOCK_VIDEO_BASE_URL` to get the video + pause-button version.
17. **Mobile design:** only desktop frames exist; mobile uses the same tokens scaled (slot = 86vw 16:9 box).
18. **About CTAs:** "See what’s costing you" / "Book a call" destinations are unknown → buttons without actions until
    `ctas[].href` is set. The sheet closes on Esc or an outside tap (no close control in the design).
19. **Licensed fonts:** NAP MD Grotesk / Times New Literature files are not in the repo (fallbacks: Inter / Times).
20. **Media context copy:** mock data uses the Figma placeholders "Label" / "Description"; real copy comes from each
    media asset's `label` / `description` in Studio.

## What's left

- Create `polis-engineering/agency-site` and move this history there (below); connect the Vercel project to it.
- Sanity project id + CORS, Mux credentials in Studio, real content.
- Cross-browser/device QA (iOS Safari, Firefox, Edge) and real-trackpad tuning of the gesture knobs.
- Lighthouse pass; design tokens per breakpoint (mobile frame); captions; phase-2 expand content.
- Alter Start MP4s (host + `NEXT_PUBLIC_MOCK_VIDEO_BASE_URL`), licensed font files, About CTA destinations.

## Moving to `polis-engineering/agency-site`

This history was bootstrapped on orphan branches of `polis-engineering/Playground` (`polis/cylinder-gallery-main-b9d6`
= repo root commit, `polis/cylinder-gallery-slice-b9d6` = this work). It shares no commits with Playground.

```bash
gh repo create polis-engineering/agency-site --private \
  --description "Polis, Works agency site (Next.js + Sanity + Three.js + GSAP)"
git clone --single-branch -b polis/cylinder-gallery-slice-b9d6 https://github.com/polis-engineering/Playground agency-site
cd agency-site
git fetch origin polis/cylinder-gallery-main-b9d6
git remote add site https://github.com/polis-engineering/agency-site.git
git push site origin/polis/cylinder-gallery-main-b9d6:refs/heads/main
git push site HEAD:refs/heads/feat/vertical-slice
# open a PR feat/vertical-slice → main, then delete the two Playground branches
```
