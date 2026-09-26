# Props reference

Every layout / 3D / timing value is a prop with its default in `src/lib/gallery/defaults.ts` (spec §5: no silent magic
numbers). All of them are live-editable at **`/dev`**.

Tags: **[FACT]** locked by spec v0.2 · **[ASSUMPTION]** spec default until contradicted · **[IMPL]** implementation knob the
spec does not name (exposed so it is never silent) · **[OPEN]** needs a product decision.

Components live in `src/components/gallery/`. Most apps only render `<Gallery>`, which composes the others and forwards
prop groups:

```tsx
<Gallery
  items={items}
  cylinder={{ peekRatio: 0.33, snapDurationMs: 620 }}
  card={{ height: "min(48dvh, 64vw)", borderRadius: "20px" }}
  media={{ intervalMs: 3500 }}
  expand={{ flipDurationMs: 500 }}
  gestures={{ wheelStepThreshold: 40 }}
/>
```

---

## `CylinderGallery` (spec §5) — `<Gallery cylinder={…}>`

| Prop | Type | Default | Tag | Notes |
|---|---|---|---|---|
| `items` | `GalleryItem[]` | required | [FACT] | From Sanity (`getGalleryItems()`), mock fallback. Passed as `<Gallery items>`. |
| `initialIndex` | `number` | `0` | | Rounded; clamped when `loop=false`. Read on mount only. |
| `visibleCount` | `3` | `3` | [FACT] | Type-locked to `3`. |
| `peekRatio` | `number` | `0.33` | [FACT] | Visible fraction of the top/bottom card's *projected* height. Clamped to `[0, 0.9]`. |
| `radius` | `number \| "auto"` | `"auto"` | [FACT] | `"auto"` = perspective-correct binary search so the neighbour peek equals `peekRatio` for the current viewport height and card height. A number is used as-is (px, clamped `≥ 0`). |
| `itemAngularSpacing` | `number` (radians) | derived | [FACT] | Derived: `2π / max(N, minVirtualSlots, 5)`. Explicit values clamped to `(0.01, π/2 − 0.01)`. |
| `minVirtualSlots` | `number` | `12` | [FACT] | Pads short lists for orbit math. Floor of `5` keeps the ±1 neighbours front-facing. |
| `perspectiveFov` | `"auto" \| number` | `"auto"` | [FACT] | Vertical FOV in degrees (Three.js `PerspectiveCamera.fov`). `"auto"` = `30°` [IMPL]. Clamped `[1, 170]`. |
| `snapDurationMs` | `number` | `620` | [ASSUMPTION] | GSAP tween of the orbit position. `0` = instant. |
| `snapEase` | GSAP ease string | `"power4.out"` | | Quartic ease-out, matches s.page. |
| `loop` | `boolean` | `true` | [FACT] | Infinite wrap. `false` clamps to `[0, N−1]`. |
| `locked` | `boolean` | `false` | [FACT] | Blocks wheel / swipe / click / keys. `Gallery` forces `true` while expanded. |
| `onActiveChange` | `(index, direction: 1 \| -1) => void` | — | | Fires when a snap starts. |
| `onSnapSettle` | `(index) => void` | — | | Fires when the snap tween completes. |
| `className` / `style` | — | — | | Escape hatches. On `<Gallery>` they apply to the root. |

`CylinderGallery` also accepts `renderItem`, `onCenterClick`, `gestures`, `tiltTopDeg`, `tiltBottomDeg`, `ariaLabel` and a
`ref` exposing `{ step(±1), snapTo(index), activeCardElement(), isSnapping() }`.

## `GalleryItemCard` (spec §5) — `<Gallery card={…} cardAspect>`

| Prop | Type | Default | Tag | Notes |
|---|---|---|---|---|
| `item` | `GalleryItem` | required | | Supplied by the cylinder. |
| `slot` | `"top" \| "center" \| "bottom" \| "hidden"` | required | | Supplied by the cylinder (`data-slot`). |
| `isActive` | `boolean` | | | Settled center only. |
| `isExpanded` | `boolean` | `false` | | Pauses the stage. |
| `mediaIndex` | `number` | `0` | [FACT] | Frozen frame when inactive; `Gallery` persists it per item. |
| `aspect` | `"16:9" \| "4:3" \| "1:1"` | current media | | Override via `<Gallery cardAspect>`. |
| `onExpand` | `() => void` | — | | Standalone use. Inside the cylinder the center click is routed by `CylinderGallery.onCenterClick`. |
| `width` | CSS length | `min(86vw, calc(48dvh * 4 / 3))` | [OPEN §12.4] | Fixed outer shell. The orbit measures this box. |
| `height` | CSS length | `min(48dvh, calc(86vw * 3 / 4))` | [OPEN §12.4] | |
| `borderRadius` | CSS length | `20px` | [OPEN §12.4] | |
| `padding` | CSS length | `0px` | [OPEN §12.4] | |
| `background` | CSS color | `#161618` | [OPEN §12.4] | Also the letterbox colour. |
| `shadow` | CSS box-shadow | `0 30px 80px rgba(0,0,0,0.45)` | [OPEN §12.4] | |
| `tiltTopDeg` / `tiltBottomDeg` | `number` (deg) | derived | | Derived = orbit angle. A value sets the tilt at the ±1 slot and scales proportionally in between (multiplier = `tiltDeg / spacingDeg`). |

Tokens become CSS custom properties (`--cg-card-*`) on the gallery root, so any CSS length works (`clamp()`, `dvh`, …).

## `ActiveMediaStage` (spec §5) — `<Gallery media={…}>`

| Prop | Type | Default | Tag | Notes |
|---|---|---|---|---|
| `assets` | `MediaAsset[]` | required | [FACT] | 3–8 (enforced in Studio). |
| `intervalMs` | `number` | `3500` | [FACT] | Fresh timer each time the stage starts running (settle, collapse, Space resume). |
| `paused` | `boolean` | `false` | [FACT] | `Gallery` also pauses on Space, off-viewport (IntersectionObserver ≥ 25 %), hidden tab, expanded. |
| `bounce` | `{ duration, ease, fromScale }` | `{ 0.45, "back.out(1.7)", 0.94 }` | [ASSUMPTION] / `fromScale` [IMPL] | `scale` on the inner node only (transform-only). |
| `aspectMorph` | `{ duration, ease }` | `{ 0.45, "power3.inOut" }` | [IMPL] | GSAP Flip on the absolutely positioned frame; outer shell never changes (CLS 0). |
| `onIndexChange` | `(index, assetKey) => void` | — | | `<Gallery onMediaIndexChange(itemIndex, mediaIndex)>`. |
| `frozenFrame` | asset `_key` | first asset | [FACT] | Start frame; persisted by `Gallery` when the card leaves center. |
| `mediaErrorSkipMs` | `number` | `1200` | [ASSUMPTION §10] | Failed media shows poster / solid fallback, then skips after this delay. |

Implementation detail: every card hosts one stage instance; only the settled center is `active`. This keeps the same
`<video>` element alive so leaving the center keeps the exact last frame.

## `ExpandShell` (spec §5) — `<Gallery expand={…} expandContent>`

| Prop | Type | Default | Tag | Notes |
|---|---|---|---|---|
| `open` | `boolean` | | | Controlled by `Gallery` (Enter / click center). |
| `onClose` | `() => void` | | [FACT] | Esc; also the `×` button ([OPEN] mobile affordance, see README). |
| `children` | `ReactNode` | `"Soon, check back later"` | [FACT] | `<Gallery expandContent>`. |
| `scroll` | `"vertical"` | `"vertical"` | [FACT] | Only vertical scroll, only inside the shell. |
| `flipDurationMs` | `number` | `500` | [ASSUMPTION] | Flip open/close and the cylinder fade. |
| `flipEase` | GSAP ease string | `"power3.inOut"` | [IMPL] | |
| `inset` | CSS inset | `max(12px, 3dvh) max(12px, 3vw)` | [OPEN §12.4] | Expanded shell geometry. |
| `borderRadius` | CSS length | `24px` | [OPEN §12.4] | Flip tweens from the card radius. |
| `background` | CSS color | `#161618` | [OPEN §12.4] | |
| `mediaMaxHeight` | CSS length | `70dvh` | [OPEN §12.4] | Expanded media box = asset aspect, capped here. |

## Gestures [IMPL] — `<Gallery gestures={…}>`

| Prop | Default | Notes |
|---|---|---|
| `wheelStepThreshold` | `40` px | Accumulated wheel delta that triggers one step. |
| `wheelIdleResetMs` | `180` ms | Quiet gap that re-arms the wheel after a step (swallows trackpad momentum → one step per flick). |
| `swipeMinDistancePx` | `40` px | Vertical swipe distance for one step. |
| `swipeMinVelocity` | `0.35` px/ms | …or a flick faster than this beyond `tapSlopPx`. |
| `tapSlopPx` | `8` px | Movement below this is a tap (click); above it the click is suppressed. |

## Orbit guards [IMPL] — `ORBIT_GUARDS`

`minSlotsFloor 5`, `spacingMin 0.01`, `spacingMax π/2 − 0.01`, `autoFovDeg 30`, `fovMinDeg 1`, `fovMaxDeg 170`,
`peekRatioMin 0`, `peekRatioMax 0.9`, `renderWindow 2` (DOM slots either side of center), `solverIterations 60`.

## Keyboard (spec §6)

| Key | Action |
|---|---|
| `ArrowDown` / `ArrowUp` | Next / previous (ignored while snapping or expanded) |
| `Enter` | Expand active |
| `Escape` | Collapse expand (and closes the `/dev` panel) |
| `Space` | Pause / resume center media + its animations (while expanded, Space scrolls natively) |

Keys are ignored when focus is in an input/select/textarea/contenteditable or inside `[data-gallery-ignore-keys]`.
