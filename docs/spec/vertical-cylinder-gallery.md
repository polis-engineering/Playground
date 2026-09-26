# Spec: Vertical Snap Cylinder Gallery

**Status:** Draft v0.2 — decisions locked; residual `[OPEN]` are copy/phase-2 only  
**Stack:** Next.js (App Router) + React + Sanity + GSAP + Three.js  
**Reference:** [s.page](https://s.page/) homepage featured-work orbit (`createFeaturedMemberSphere`)

---

## 0. Labels

- `[FACT]` — decided with Polis  
- `[ASSUMPTION]` — default until contradicted  
- `[OPEN]` — needs a product decision  

---

## 1. Problem / outcome

**Problem:** Present a dynamic list of media-rich “placeholders” (gallery items) in a vertical cylindrical orbit so only three are readable at once, with the center item cycling media and later expanding in-place for detail.

**Outcome:** A build-ready, prop-driven component that works on all major desktop/mobile browsers, hosts on Vercel, is CMS-driven via Sanity, and exposes every layout/3D/timing knob without silent magic numbers.

**Non-goals**

- Native iOS/Android apps  
- Continuous auto-spin of the cylinder  
- Respecting `prefers-reduced-motion` for this component `[FACT]`  
- Fully designed expand content (placeholder copy only for now) `[FACT]`  

---

## 2. Library / framework call

### What s.page actually uses `[FACT — from live bundle 2026-09-26]`

| Concern | s.page |
|---|---|
| Cylinder / Y-orbit | **Custom Three.js** scene: DOM cards projected via `matrix3d`, items on a vertical circle (`createFeaturedMemberSphere`) |
| Gesture debounce | **Custom** `slide-gesture` (wheel + swipe → single step) |
| Snap feel | Custom RAF ease-out (~620ms, quartic) — **not** CSS scroll-snap |
| UI motion | **Motion** (Framer Motion fingerprints: `motionComponentSymbol`, `framerAppearId`, springs) |
| Content / route morph | **View Transitions API** (`startViewTransition`) |
| Not present | GSAP, Lenis, Embla, Swiper |

s.page is a Vite + React SPA (“Uber for design services”), not Next.js — pattern is transferable; hosting/CMS choices below are ours.

### Recommended stack for this project

| Layer | Pick | Why |
|---|---|---|
| App | **Next.js App Router + React + TypeScript** | `[FACT]` + Vercel |
| CMS | **Sanity** (already connected) | Written + visual, CDN images, portable text later |
| Cylinder orbit | **Three.js** (s.page pattern) — thin wrapper, DOM overlay cards | Matches proven Y-orbit + peek; widely used; GPU transforms |
| Gestures | Port s.page-style **wheel/swipe/keyboard step controller** (small custom module) | Trusted pattern; avoids scroll-jack conflicts with page scroll |
| Bounce / aspect morph | **GSAP** (+ **GSAP Flip** for aspect box) | `[FACT]` user request; Flip keeps aspect changes without layout shift |
| Expand content-shift | **GSAP Flip** primary | Same family as bounce; FLIP is the popular imperative content-shift lib; pairs with expand hide-cylinder |
| Alt content-shift | **Motion** `layout` / `layoutId` | Most popular React-declarative option; use only if you want to avoid Flip for expand — **do not dual-drive the same nodes** |
| Media | Sanity image CDN + Sanity/Mux video (or Sanity file + `<video>`) | Fast delivery on Vercel edge |

**Rejected for cylinder:** Embla / Swiper / CSS-only scroll-snap — poor fit for true Y-axis 3D orbit with 33% peek + infinite wrap at dynamic N.  
**Rejected for content-shift alone:** View Transitions API as sole expand tool — good for routes; weaker for in-place placeholder morph with interruptible bounce.

---

## 3. Information architecture

```
GalleryPage
└── CylinderGallery (viewport: exactly 3 slots)
    ├── SlotTop     (~33% visible, tilted)
    ├── SlotCenter  (100% face-on, media cycle active)
    └── SlotBottom  (~33% visible, tilted)
        └── GalleryItem (Sanity doc)
            └── MediaSequence (3–8 assets)
└── ExpandedOverlay (when expanded)
    └── Placeholder: "Soon, check back later"
    └── (future: title / body / media / CTAs + vertical scroll)
```

---

## 4. Screen / flow map

| State | Visible | Cylinder | Center media |
|---|---|---|---|
| Idle orbit | 3 slots | Interactive | Cycles every 3.5s |
| Snapping | 3 slots | Animating to next index | Previous center frozen on leave |
| Expanded | Active item scaled up | Hidden + locked | Paused |
| Collapsed | Back to orbit | Restored at same item index | Resume from frozen frame `[ASSUMPTION]` |

**Scroll direction `[FACT]`:** wheel/swipe **down** advances so content moves **toward top** (next item enters from bottom).

**Loop `[FACT]`:** infinite wrap — after last, first.

---

## 5. Component inventory

### `CylinderGallery`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | `GalleryItem[]` | required | From Sanity |
| `initialIndex` | `number` | `0` | |
| `visibleCount` | `3` | locked | Only 3 visible `[FACT]` |
| `peekRatio` | `number` | `0.33` | Top/bottom visible fraction |
| `radius` | `number \| "auto"` | `"auto"` | Auto from viewport height (s.page style) |
| `itemAngularSpacing` | `number` | derived | `2π / max(N, minSlots)` |
| `minVirtualSlots` | `number` | `12` | s.page pads short lists for orbit math |
| `perspectiveFov` | `"auto" \| number` | `"auto"` | |
| `snapDurationMs` | `number` | `620` | Match s.page feel `[ASSUMPTION]` |
| `snapEase` | GSAP ease string | `"power4.out"` | |
| `loop` | `boolean` | `true` | |
| `locked` | `boolean` | `false` | True while expanded |
| `onActiveChange` | `(index, direction) => void` | — | |
| `onSnapSettle` | `(index) => void` | — | |
| `className` / `style` | — | — | Layout escape hatches |

### `GalleryItemCard` (placeholder shell)

| Prop | Type | Default |
|---|---|---|
| `item` | `GalleryItem` | required |
| `slot` | `"top" \| "center" \| "bottom" \| "hidden"` | required |
| `isActive` | `boolean` | |
| `isExpanded` | `boolean` | |
| `mediaIndex` | `number` | frozen when inactive |
| `aspect` | `"16:9" \| "4:3" \| "1:1"` | from current media |
| `onExpand` | `() => void` | Enter / click center |
| `width` / `height` / `borderRadius` / `padding` / `background` / `shadow` | CSS tokens | all exposed |
| `tiltTopDeg` / `tiltBottomDeg` | derived from orbit | overridable multipliers |

### `ActiveMediaStage` (center only)

| Prop | Type | Default |
|---|---|---|
| `assets` | `MediaAsset[]` | 3–8 |
| `intervalMs` | `number` | `3500` `[FACT]` |
| `paused` | `boolean` | spacebar / off-viewport / expanded |
| `bounce` | GSAP config | `{ duration: 0.45, ease: "back.out(1.7)" }` `[ASSUMPTION]` |
| `aspectMorph` | GSAP Flip config | no layout shift — see §7 |
| `onIndexChange` | `(i) => void` | |
| `frozenFrame` | last shown asset id | persist on leave `[FACT]` |

### `ExpandShell`

| Prop | Type | Default |
|---|---|---|
| `open` | `boolean` | |
| `onClose` | `() => void` | Esc |
| `children` | ReactNode | Phase 1: `"Soon, check back later"` `[FACT]` |
| `scroll` | `"vertical"` | only `[FACT]` |
| `flipDurationMs` | `number` | `500` `[ASSUMPTION]` |

---

## 6. Interaction & keyboard

| Input | Action |
|---|---|
| Wheel / trackpad (vertical dominant) | Step ±1 (debounced; ignore while snapping) |
| Touch swipe vertical | Step ±1 |
| `ArrowDown` | Next |
| `ArrowUp` | Previous |
| `Enter` | Expand active |
| `Esc` | Collapse expand **and** any overlay `[FACT]` |
| `Space` | Pause/resume media **and** animations in center viewport `[FACT]` |
| Click/tap non-center card | Snap that index to center (s.page pattern) `[FACT]` |
| Click/tap center (no dedicated control) | Expand `[FACT — locked v0.2]` |

**Off-viewport / leave center:** pause media; keep last frame `[FACT]`.

**Expanded:** cylinder disappears + `locked=true`; collapse restores **same item index**; media index = last frozen frame; **3.5s timer restarts fresh** on return to center `[FACT — locked v0.2]`.

---

## 7. Motion (GSAP)

### Aspect morph without layout shift `[FACT requirement]`

1. Outer shell has **fixed slot box** (width/height from layout tokens — does not change with aspect).  
2. Inner stage uses GSAP Flip (or width/height tween on an absolutely positioned media frame) between aspect ratios `16:9` / `4:3` / `1:1`.  
3. Letterbox/pillarbox inside the fixed shell; **outer placeholder metrics never change**.  
4. Bounce/pop is a scale transform on the inner media only (`transform-only`, `will-change: transform`).

### Expand

1. Flip capture on active card.  
2. Hide/lock cylinder.  
3. Flip to full expanded shell.  
4. Show placeholder copy.  
5. Reverse on Esc / close.

---

## 8. Data contract (Sanity)

### Schema (proposed)

```ts
// galleryItem
{
  _type: "galleryItem",
  title: string,                 // for a11y / CMS
  slug: slug,
  media: MediaAsset[],           // length 3–8 enforced in Studio
  // expandContent: portable text + blocks — [OPEN] phase 2
}

// mediaAsset
{
  _type: "mediaAsset",
  kind: "image" | "video",
  aspect: "16:9" | "4:3" | "1:1",  // required; or derived from asset metadata [OPEN]
  image?: image,
  video?: mux.video,              // Mux via Sanity plugin [FACT — locked v0.2]
  alt: string,
  poster?: image,                // required for video [FACT]
}
```

| Rule | Value |
|---|---|
| Items in cylinder | Dynamic; start with **3** `[FACT]` |
| Media per item | **3–8** `[FACT]` |
| Empty list | Show empty state component `[OPEN copy]` |
| Invalid aspect | Fall back to `16:9` + log `[ASSUMPTION]` |

---

## 9. Accessibility (partial — per product override)

- Component **does not** honor `prefers-reduced-motion` `[FACT]`  
- Focus trap in expand; restore focus to active card on close  
- `aria-roledescription="carousel"` (or custom “cylinder gallery”) + `aria-live` polite on active title change  
- Videos: no autoplay sound; captions `[OPEN]`  

---

## 10. Empty / loading / error

| State | Behavior |
|---|---|
| Loading Sanity | Skeleton cards in 3 slots (no orbit until ≥1 item) |
| 0 items | Empty state `[OPEN]` |
| 1–2 items | Still loop; pad virtual slots for orbit math |
| Media fail | Poster / solid fallback; skip to next asset after timeout `[ASSUMPTION]` |
| Video buffer | Keep prior frame; no CLS |

---

## 11. Acceptance criteria

1. Exactly 3 placeholders visible; top & bottom ≈33% peek at all breakpoints.  
2. Infinite wrap with 3+ items.  
3. Wheel, trackpad, touch, ArrowUp/Down all step one item with relaxed snap.  
4. Center media advances every 3.5s with bounce/pop; aspect changes among 16:9 / 4:3 / 1:1 with **zero outer layout shift**.  
5. Leaving center freezes last frame; Space pauses center media/animation; leaving viewport pauses.  
6. Enter or click/tap center expands active; cylinder hidden + locked; Esc collapses; same item + frozen media index restored; 3.5s timer restarts fresh.  
7. Expand body shows **"Soon, check back later"**; vertical scroll only inside expand.  
8. All §5 props overridable without breaking orbit math (guards + `minVirtualSlots`).  
9. Lighthouse/CWV: no CLS from media cycle; transforms only for bounce; Sanity images use CDN + sized URLs.  
10. Works on current Chrome, Safari, Firefox, Edge — desktop and mobile.

---

## 12. Decisions locked in v0.2 + residual opens

### Locked (spec judgement)

| Decision | Pick | Rationale |
|---|---|---|
| Expand trigger | **Click/tap center** (no dedicated button) | Matches s.page “select active” mental model; fewer chrome controls on a 3-slot UI |
| Non-center click | Snap that item to center | s.page pattern; discoverable |
| Collapse media | Keep **frozen media index**; restart **3.5s** timer fresh | Predictable; avoids mid-clip surprise after expand |
| Video pipeline | **Mux + Sanity** (`sanity-plugin-mux-input` or equivalent) | Adaptive streaming, posters, better Core Web Vitals than raw Sanity files on mobile |
| Aspect source | **Editorial `aspect` field required** in Studio; auto-detect as validation hint only | Prevents CLS from wrong metadata |
| Content-shift lib | **GSAP Flip** for expand + aspect morph | One animation bus with bounce; Motion reserved if you later want declarative UI elsewhere — do not Flip+layoutId the same node |
| Cylinder | **Three.js r169-class** custom orbit (s.page) | Proven Y-orbit + peek; lazy chunk |

### Still `[OPEN]` (non-blocking for implementers)

1. Empty-state and media-error copy  
2. Expand body schema (phase 2 — placeholder string only now)  
3. Video captions / transcripts  
4. Exact token values for width/height/radius per breakpoint (expose props; design later)  


## 13. Implementer notes

- Prefer **client component** island for the gallery; keep Sanity fetch on server.  
- Lazy-load Three.js chunk (s.page pattern).  
- One GSAP context (`gsap.context`) per gallery for cleanup.  
- Do not mix Motion `layout` and GSAP Flip on the same expand node.  
