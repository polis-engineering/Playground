# Figma Correction Guide

## Quick start

1. Run dev server: `pnpm dev`
2. Open `http://localhost:3000?debug=figma`
3. Hover elements to see Figma node IDs
4. Click a node to pin it for live editing

## Live Debug workflow

1. Enable overlay via `?debug=figma` or the **Figma overlay** checkbox in Design Panel
2. **Hover** a node → blue highlight + tooltip (nodeId, name, manifest path)
3. **Click** a node → orange pinned ring; **Selected Node** tab opens automatically
4. Edit properties in the panel → DOM updates instantly on every input/drag
5. **Copy snippet** → paste `@figma` commands into chat for permanent fixes
6. **Reset node** → clears inline styles for that node only
7. **Escape** → clears pinned selection

Live overrides persist in `localStorage` (`polis-node-overrides`) for preview across reloads. They are **preview-only** until an agent commits changes to source files.

## Chat templates

### Property fix

```
@figma node:88:179 property:font-weight value:600
```

Maps to: node `88:179` (Shivam Bharadwaj) → change font-weight to 600.

### Spacing fix

```
@figma node:88:189 property:gap value:20px
```

Maps to: content grid → change gap to 20px.

### Full re-sync from Figma

```
@figma re-sync node:88:174
```

Agent should call Figma MCP `get_design_context` for desktop frame before editing.

## Overlay usage

| Action | Result |
|--------|--------|
| Hover `[data-node-id]` element | Blue highlight + tooltip with nodeId, name, manifest path |
| Click highlighted element | Pins node (orange ring); opens Selected Node tab |
| Escape | Clears pinned selection |
| Edit in Selected Node tab | Live DOM update + snippet preview |

## Adjustment panel → chat handoff

### Global tokens

1. Open **Design Panel** (bottom-right)
2. Use **Global Tokens** tab — tweak typography, spacing, colors, or motion
3. Changes apply instantly while dragging sliders (`onInput`)
4. Click **Copy tokens**
5. Paste JSON into chat: "Apply these token values permanently"

### Per-node overrides

1. Pin a node via overlay click
2. Edit properties in **Selected Node** tab
3. Click **Copy snippet** for that node's overrides
4. Or use **Copy all overrides** in Debug section for every pinned edit

Example token output:

```json
{
  "fontSize": "15px",
  "lineHeight": "21.75px",
  "colorPrimary": "#202020"
}
```

Example node override output:

```
@figma node:88:179 property:font-weight value:600
@figma node:88:189 property:gap value:20px
```

## Agent workflow

1. Parse `@figma` phrase
2. Look up node in `src/figma/manifest.ts`
3. Edit component at `componentPath`
4. Update manifest `cssProperties` if permanent
5. Update `src/figma/tokens.ts` if global token change

## Motion toggles

- **Motion enabled:** toggles GSAP entrance animation (re-runs on change in dev)
- **Stagger / Duration:** adjust entrance timing for testing
- `prefers-reduced-motion: reduce` always disables GSAP regardless of toggle
