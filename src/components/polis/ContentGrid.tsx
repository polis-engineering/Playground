import { InfoColumn } from "./InfoColumn";
import { LinksColumn } from "./LinksColumn";

export function ContentGrid() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-[var(--polis-grid-gap)] w-full"
      data-node-id="88:189"
      data-name="div"
      data-animate="entrance"
    >
      <InfoColumn />
      <LinksColumn />
    </div>
  );
}
