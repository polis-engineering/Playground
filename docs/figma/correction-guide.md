# Figma Correction Guide

## Quick start

1. Run dev server: `pnpm dev`
2. Open `http://localhost:3000?debug=figma`
3. Hover elements to see Figma node IDs
4. Click an element to copy a correction snippet

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
| Click highlighted element | Copies `@figma node:{id} property: inspect value:review` to clipboard |
| Edit snippet | Replace `property` and `value` before pasting in chat |

## Adjustment panel → chat handoff

1. Open **Design Panel** (bottom-right)
2. Tweak typography, spacing, colors, or motion
3. Click **Copy tokens**
4. Paste JSON into chat: "Apply these token values permanently"

Example output:

```json
{
  "fontSize": "15px",
  "lineHeight": "21.75px",
  "colorPrimary": "#202020"
}
```

## Agent workflow

1. Parse `@figma` phrase
2. Look up node in `src/figma/manifest.ts`
3. Edit component at `componentPath`
4. Update manifest `cssProperties` if permanent
5. Update `src/figma/tokens.ts` if global token change

## Motion toggles

- **Motion enabled:** toggles GSAP entrance animation
- **Stagger / Duration:** adjust entrance timing for testing
- `prefers-reduced-motion: reduce` always disables GSAP regardless of toggle
