# Props reference

Every layout / 3D / timing value is a prop with its default in `src/lib/gallery/defaults.ts` (spec §5: no silent magic
numbers). Visual values come from the Figma tokens in `src/app/tokens.css`. All of them are live-editable at **`/dev`**.

Tags: **[FACT]** locked by spec v0.2 · **[ASSUMPTION]** spec default until contradicted · **[IMPL]** implementation knob the
spec does not name (exposed so it is never silent) · **[FIGMA]** taken from the Figma file / motion context ·
**[OPEN]** needs a product decision.

Components live in `src/components/gallery/` (gallery) and `src/components/site/` (page chrome). Most apps render
`<Gallery>`, which composes the gallery components and forwards prop groups:

```tsx
<Gallery
  items={items}
  cylinder={{ peekRatio: 0.33, snapDurationMs: 620 }}
  card={{ borderRadius: "var(--radius-4xl)" }}
  media={{ intervalMs: 3500 }}
  expand={{ flipDurationMs: 400 }}
  gestures={{ wheelStepThreshold: 40 }}
/>
```

---

## `CylinderGallery` (spec §5) — `<Gallery cylinder={…}>`

Concave drum: the ±1 neighbours curve **toward** the viewer and tilt to face the center (top card faces down, bottom
card faces up). Each card carries its own full CSS projection (no shared `preserve-3d` context), see `orbitScene.ts`.

| Prop | Type | Default | Tag | Notes |
|---|---|---|---|---|
| `items` | `GalleryItem[]` | required | [FACT] | From Sanity (`getGalleryItems()`), mock fallback. Passed as `<Gallery items>`. |
| `initialIndex` | `number` | `0` | | Rounded; clamped when `loop=false`. Read on mount only. |
| `visibleCount` | `3` | `3` | [FACT] | Type-locked to `3`. |
| `peekRatio` | `number` | `0.33` | [FACT] | Visible fraction of the top/bottom card's *projected* height. Clamped to `[0, 0.9]`. |
| `radius` | `number \| "auto"` | `"auto"` | [FACT] | `"auto"` = perspective-correct solve so the neighbour peek equals `peekRatio` without covering the center card. A number is used as-is (px, `≥ 0`). |
| `itemAngularSpacing` | `number` (radians) | derived | [FACT] | Derived: `2π / max(N, minVirtualSlots, 5)`. Explicit values clamped to `(0.01, π/2 − 0.01)`. |
| `minVirtualSlots` | `number` | `12` | [FACT] | Pads short lists for orbit math. |
| `perspectiveFov` | `"auto" \| number` | `"auto"` | [FACT] | Vertical FOV in degrees (Three.js `PerspectiveCamera.fov`). `"auto"` = **27°** [FIGMA]: reproduces the frame's neighbour size (≈ 496px tall at 1512×982). Clamped `[1, 170]`. |
| `snapDurationMs` | `number` | `620` | [ASSUMPTION] | GSAP tween of the orbit position. `0` = instant. |
| `snapEase` | GSAP ease string | `"power4.out"` | | Quartic ease-out, matches s.page. |
| `loop` | `boolean` | `true` | [FACT] | Infinite wrap. `false` clamps and renders no wrapped neighbours. |
| `locked` | `boolean` | `false` | [FACT] | Blocks wheel / swipe / click / keys. Forced `true` while expanded or while the About sheet is open. |
| `onActiveChange` | `(index, direction: 1 \| -1) => void` | — | | Fires when a snap starts. |
| `onSnapSettle` | `(index) => void` | — | | Fires when the snap tween completes. |
| `onLayoutChange` | `(layout) => void` | — | [IMPL] | Solved orbit after each relayout, incl. `peekAchieved` / `peekReachable`. |
| `className` / `style` | — | — | | Escape hatches. On `<Gallery>` they apply to the root. |

`CylinderGallery` also accepts `renderItem`, `onCenterClick`, `gestures`, `tiltTopDeg`, `tiltBottomDeg`, `ariaLabel` and a
`ref` exposing `{ step(±1), snapTo(index), activeCardElement(), isSnapping() }`.

### When `peekRatio` is unreachable

Concave neighbours are magnified (closer to the camera). The solver searches radii where the neighbour faces the camera
and stays in front of the near plane; if the requested peek would make the neighbour cover the center card it keeps the
first radius that clears the center instead. The layout then reports `peekReachable: false` (`data-peek` /
`data-peek-reachable` on `.cg-cylinder`, the `/dev` readout, a dev-only `console.warn`). Envelope where every peek from
0.1 to 0.5 is reachable at 1512×982 and 393×852 (default card, tilt derived):

| `minVirtualSlots` | 5 | 8 | 12 (default) | 24 |
|---|---|---|---|---|
| max `perspectiveFov` | 55° | 40° | 35° | 45° |

`tiltTopDeg ≠ tiltBottomDeg` solves the radius for the bottom tilt; the top peek then differs slightly.

## `GalleryItemCard` (spec §5) — `<Gallery card={…} cardAspect>`

The card shell (orbit slot) is **transparent**. The visible placeholder is the media box inside it, whose bounds always
equal the media currently showing (Figma "Content well").

| Prop | Type | Default | Tag | Notes |
|---|---|---|---|---|
| `item` | `GalleryItem` | required | | Supplied by the cylinder. |
| `slot` | `"top" \| "center" \| "bottom" \| "hidden"` | required | | Supplied by the cylinder (`data-slot`). |
| `isActive` | `boolean` | | | Settled center only. |
| `isExpanded` | `boolean` | `false` | | Stops the cycle (fresh interval on collapse). |
| `mediaIndex` | `number` | `0` | [FACT] | Frozen frame when inactive; `Gallery` persists it per item. |
| `aspect` | `"16:9" \| "4:3" \| "1:1"` | current media | | Override via `<Gallery cardAspect>`. |
| `onExpand` | `() => void` | — | | Standalone use. Inside the cylinder the center click is routed by `CylinderGallery.onCenterClick`. |
| `width` | CSS length | `min(calc(46.93dvh * 16 / 9), 86vw)` | [FIGMA] / [OPEN] mobile | Slot = the media's max (16:9) box: 819.2 × 460.8 at 1512×982. |
| `height` | CSS length | `min(46.93dvh, calc(86vw * 9 / 16))` | [FIGMA] / [OPEN] mobile | The orbit measures this box. |
| `borderRadius` | CSS length | `var(--radius-4xl)` (32px) | [FIGMA] | Applied to the media box. |
| `padding` | CSS length | `0px` | | Shell padding. |
| `background` | CSS color | `transparent` | [FIGMA] | Fill under the media (only visible with transparent media). |
| `shadow` | CSS box-shadow | `var(--shadow-content-well)` | [FIGMA] | `0 16px 48px rgba(0,0,0,0.35)`. |
| `tiltTopDeg` / `tiltBottomDeg` | `number` (deg) | derived | | Derived = orbit angle (facing the center). A value sets the tilt at the ±1 slot and scales proportionally in between. |

Border: Figma `Border/Primary` — 3px inside gradient stroke `#3c3c43 → transparent → #3c3c43` (corner to corner),
blended with `plus-lighter` (Figma Linear Dodge).

## `ActiveMediaStage` (spec §5) — `<Gallery media={…}>`

Annex choreography (values from the Figma motion context): each clip springs out from the handoff box to its full size,
holds, compresses into the next clip's handoff box during the last 150ms, then a **hard** opacity cut. Width/height are
animated (not scale) so the aspect visibly morphs; the media box is anchored at the slot center and centered by transform
(CLS 0). Clips are stacked; only the current one is opaque.

| Prop | Type | Default | Tag | Notes |
|---|---|---|---|---|
| `assets` | `MediaAsset[]` | required | [FACT] | 3–8 (enforced in Studio). |
| `active` | `boolean` | | | Settled center, not expanded. Becoming active starts a fresh interval (spec: timer restarts fresh on collapse). |
| `intervalMs` | `number` | `3500` | [FACT] | Time per clip (annex uses 4s per clip; the spec locks 3.5s). |
| `paused` | `boolean` | `false` | [FACT] | Space, the glass pause button, off-viewport (IntersectionObserver ≥ `viewportPauseThreshold`), hidden tab. Freezes the timeline and the active video in place; resume continues. |
| `bounce` | `{ duration, spring: { decay, frequency, ratio } }` | `{ 0.4, { 7.5258, 8.7987, 0.8553 } }` | [FIGMA] | Entrance spring `1 − e^(−t·decay)(cos(t·frequency) + ratio·sin(t·frequency))`, bounce ≈ 0.35. |
| `aspectMorph` | `{ duration, ease, insetScale }` | `{ 0.15, [0.5, 0, 1, 1], 405.8 / 460.8 }` | [FIGMA] | Exit compress (`cubic-bezier(.5,0,1,1)`) into the handoff box. Handoff width = `insetScale × min(fullWidth(current), fullWidth(next))`; each clip keeps its own aspect, so the cut never jumps horizontally. `ease` also accepts a GSAP ease string. |
| `onIndexChange` | `(index, assetKey) => void` | — | | `<Gallery onMediaIndexChange(itemIndex, mediaIndex)>`. |
| `frozenFrame` | asset `_key` | first asset | [FACT] | Start frame; persisted by `Gallery` when the card leaves center. |
| `mediaErrorSkipMs` | `number` | `1200` | [ASSUMPTION §10] | Failed media shows poster / fill, then skips after this delay. |
| `controls` | `boolean` | `true` | [FIGMA] | Glass "Media context": tag (`label` · `description` from the asset) + 40px pause button (video only, center card only). |
| `onTogglePause` | `() => void` | — | | Pause button. `Gallery` maps it to the same state as Space. |
| `viewportPauseThreshold` | `number` | `0.25` | [IMPL] | `<Gallery media>` only. |

## `ExpandShell` (spec §5) — `<Gallery expand={…} expandContent>`

Open: the placeholder grows from the card's media box while the media fades + blurs out (empty placeholder), then the
copy rises in. Close reverses; the media fades back in just before landing. Interruptions continue from the current
geometry.

| Prop | Type | Default | Tag | Notes |
|---|---|---|---|---|
| `open` | `boolean` | | | Controlled by `Gallery` (Enter / click center). |
| `onClose` | `() => void` | | [FACT] | Esc; also the glass close button ([OPEN] mobile affordance). |
| `children` | `ReactNode` | `"Soon, check back later"` | [FACT] | `<Gallery expandContent>`. |
| `scroll` | `"vertical"` | `"vertical"` | [FACT] | Only vertical scroll, only inside the shell. |
| `flipDurationMs` | `number` | `400` | [ASSUMPTION] → Emil pass (was 500) | Open. |
| `flipEase` | ease | `[0.32, 0.72, 0, 1]` | [IMPL] | Strong drawer ease-out. |
| `closeDurationMs` | `number` | `300` | [IMPL] | Exit faster than enter. |
| `closeEase` | ease | `[0.77, 0, 0.175, 1]` | [IMPL] | On-screen morph → ease-in-out. |
| `mediaHideMs` / `mediaHideBlurPx` | `number` | `200` / `10` | [IMPL] | Media fade + blur as the placeholder scales up (blur masks the crossfade). |
| `copyRevealMs` / `copyOffsetPx` / `copyHideMs` | `number` | `200` / `8` / `120` | [IMPL] | Copy + close button reveal after the flip; fast hide on close. |
| `cylinderFadeOutMs` / `cylinderFadeInMs` | `number` | `200` / `300` | [IMPL] | `<Gallery expand>` only. |
| `inset` | CSS inset | `max(12px, 3dvh) max(12px, 3vw)` | [OPEN §12.4] | Expanded placeholder geometry. |
| `borderRadius` | CSS length | `var(--radius-4xl)` | [FIGMA] | Flip tweens from the card radius. |
| `background` | CSS color | `var(--backgrounds-primary)` | [FIGMA] | Empty placeholder = page color (the Linear Dodge border blends with it and vanishes, as on the Figma canvas). |

## Gestures [IMPL] — `<Gallery gestures={…}>`

| Prop | Default | Notes |
|---|---|---|
| `wheelStepThreshold` | `40` px | Accumulated wheel delta that triggers one step. |
| `wheelIdleResetMs` | `180` ms | Quiet gap that re-arms the wheel after a step (swallows trackpad momentum → one step per flick). |
| `swipeMinDistancePx` | `40` px | Vertical swipe distance for one step. |
| `swipeMinVelocity` | `0.35` px/ms | …or a flick faster than this beyond `tapSlopPx`. |
| `tapSlopPx` | `8` px | Movement below this is a tap (click); above it the click is suppressed. |

`WHEEL_LINE_HEIGHT_PX = 16` converts line-mode wheel deltas (Firefox) to px.

## Orbit guards [IMPL] — `ORBIT_GUARDS`

`minSlotsFloor 5`, `spacingMin 0.01`, `spacingMax π/2 − 0.01`, `autoFovDeg 27`, `fovMinDeg 1`, `fovMaxDeg 170`,
`peekRatioMin 0`, `peekRatioMax 0.9`, `renderWindow 2` (DOM slots either side of center), `nearPlaneFraction 0.8`
(cards past this fraction of the camera distance are hidden), `solverSamples 256`, `solverIterations 60`,
`solverMaxRadiusFactor 1000` (× viewport height), `peekTolerance 0.005`.

## Site chrome — `src/components/site/`

| Component | Figma | Notes |
|---|---|---|
| `HomePage` | `591:949` Desktop home page | Gallery + logo (`/brand/logo.svg`, 56px, top 16) + glass **About** pill (56px, bottom 24). Chrome fades out while a card is expanded. |
| `AboutSheet` | `591:948` About (bottom-sheet) | Glass sheet (Material Ultra Thin + Frost, top radius 24), max width 358 content, `ctas` prop (`{ label, href? }[]`, destinations [OPEN]). Opens with `transform 400ms var(--ease-drawer)`, closes in 250ms; Esc, outside click, focus trap, focus returns to the About pill; locks the gallery. |

## Keyboard (spec §6)

| Key | Action |
|---|---|
| `ArrowDown` / `ArrowUp` | Next / previous (ignored while snapping, expanded, or while the About sheet is open) |
| `Enter` | Expand active |
| `Escape` | Collapse expand; closes the About sheet (and the `/dev` panel) |
| `Space` | Pause / resume center media + its timeline (while expanded, Space scrolls natively) |

Keys act only when focus is on the page body or inside the gallery, so Enter/Space keep their native meaning on any other
focused control. Form fields, contenteditable and `[data-gallery-ignore-keys]` are always ignored.
