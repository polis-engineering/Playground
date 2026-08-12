# Playground — Figma-to-Code Translation

A Next.js test site mirroring the [Polis Works Figma design](https://www.figma.com/design/Ra39Tjy7Kcf74D4P7EmmJP/Polis--Works?node-id=89-266) layer-for-layer, with a correction workflow for iterative design sync.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- GSAP + `@gsap/react` for entrance animation
- Inter via `next/font/google`

## Setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Dev tools

Available only in development (`NODE_ENV=development`):

- **URL flag:** `http://localhost:3000?debug=figma` — enables Figma debug overlay
- **Design Panel:** bottom-right button — Global Tokens + Selected Node tabs
- **Overlay:** hover any element → blue highlight + tooltip; click → pin (orange ring)
- **Live editing:** pinned node properties update DOM instantly; overrides persist in localStorage
- **Copy snippet / Copy all overrides:** export `@figma` commands for chat handoff
- **Copy tokens:** exports current CSS var values as JSON for global changes

## Correction workflow

Use these phrases in Cursor chat:

```
@figma node:88:179 property:font-weight value:600
@figma node:88:189 property:gap value:20px
@figma re-sync node:88:174
```

See [docs/figma/correction-guide.md](docs/figma/correction-guide.md) for the full Live Debug workflow.

## Project structure

```
src/
├── app/                  # Next.js app shell
├── components/polis/     # Figma-faithful component tree
├── components/dev/       # Debug overlay + adjustment panel + live inspector
├── context/              # LiveDebugContext (dev only)
├── figma/                # manifest.ts + tokens.ts
├── hooks/                # useDesignAdjustments, useLiveNodeOverrides
└── lib/gsap/             # useEntranceAnimation
```

## Scripts

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm lint     # ESLint
```

## Skills

- **Emil design engineering:** `.cursor/skills/emil-design-eng/SKILL.md`
- **Cursor rules:** `.cursor/rules/figma-translation.mdc`
