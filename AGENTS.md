# AGENTS.md

## Project

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, GSAP. Package manager: pnpm.

## Run commands

- Dev: `pnpm dev`
- Build: `pnpm build`
- Test: (none configured)
- Lint: `pnpm lint`
- Type check: `pnpm build` (includes TypeScript)

## Architecture

- **Figma source:** fileKey `Ra39Tjy7Kcf74D4P7EmmJP`, section node `89:266`
- **Component tree:** `src/components/polis/*` mirrors Figma layers with `data-node-id` on every node
- **Manifest:** `src/figma/manifest.ts` — node registry linking Figma IDs to component paths
- **Tokens:** `src/figma/tokens.ts` — CSS custom properties for typography, spacing, colors, motion
- **Dev tools:** `src/components/dev/*` — overlay + adjustment panel (development only)

## Pipeline stages

This project is a design translation playground, not a full product pipeline. For Figma sync work:

1. MCP `get_design_context` → 2. Compare manifest → 3. Edit component → 4. Verify visually → 5. Update manifest/tokens

## Conventions

- Preserve `data-node-id` and `data-name` on every DOM node
- Use CSS vars from tokens; avoid hardcoded Figma values
- Link hover: CSS transitions; entrance: GSAP with reduced-motion guard
- Dev overlay enabled via `?debug=figma` or panel toggle

## Skills

- Emil design engineering: `.cursor/skills/emil-design-eng/SKILL.md`
- Figma translation rules: `.cursor/rules/figma-translation.mdc`

## Done means

- Lint passes. Build succeeds. Every visible element has correct `data-node-id`. Visual parity with Figma desktop (1512px) and mobile (393px).
