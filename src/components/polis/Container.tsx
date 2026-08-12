import { HeaderBlock } from "./HeaderBlock";
import { IntroBlock } from "./IntroBlock";
import { ContentGrid } from "./ContentGrid";

export function Container() {
  return (
    <div
      className="flex flex-1 flex-col items-start max-w-[var(--polis-container-max-width)] min-w-px overflow-clip w-full gap-[var(--polis-container-gap)] px-[var(--polis-section-padding-x)] py-[var(--polis-section-padding-y)] md:py-10"
      data-node-id="88:178"
      data-name="container"
      data-animate="entrance"
    >
      <HeaderBlock />
      <IntroBlock />
      <ContentGrid />
    </div>
  );
}
