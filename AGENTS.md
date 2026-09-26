# AGENTS.md

Stack: Next.js 16 App Router, React 19, TypeScript, Three.js (lazy), GSAP 3 + Flip + @gsap/react, Sanity 6 +
sanity-plugin-mux-input, Vitest. Package manager: pnpm 11.

## Commands

- Dev: `pnpm dev` · Test: `pnpm test` · Lint: `pnpm lint` · Build/type-check: `pnpm build`

## Rules

- Product rules come from `docs/spec/vertical-cylinder-gallery.md` (v0.2). Do not invent copy or behaviour; label gaps `[OPEN]`.
- Every layout/3D/timing number is a prop with its default in `src/lib/gallery/defaults.ts`; document it in `docs/props.md`
  and expose it in `/dev`.
- Pure logic lives in `src/lib/gallery/*` and is test-first (`tests/*.test.ts`).
- Cylinder = Three.js pose math → CSS `matrix3d` on React-owned DOM. No scroll-snap / Embla / Swiper / Lenis.
- Animation = GSAP (+ Flip). Never drive the same node with Flip and Motion `layoutId`.
- Media cycle must keep CLS at 0: animate the absolutely positioned `.cg-frame` only; bounce is `scale` on `.cg-frame-inner`.
- Do not add `prefers-reduced-motion` handling (product decision).
- Visual values come from Figma (fileKey `Ra39Tjy7Kcf74D4P7EmmJP`, frames `591:949` home, `591:948` About sheet) via the CSS
  custom properties in `src/app/tokens.css`. Use `get_design_context` / `get_motion_context` before changing layout or motion;
  keep `data-node-id` on Figma-mapped elements.
- The visible card is the media box (`.cg-frame`); the orbit slot and card shell stay transparent.
