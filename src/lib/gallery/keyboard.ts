export type KeyAction = "next" | "prev" | "expand" | "collapse" | "togglePause";

/** Spec §6. While expanded the cylinder is locked: only Escape acts; Space falls through to native scroll. */
export function keyToAction(key: string, state: { expanded: boolean }): KeyAction | null {
  if (key === "Escape" || key === "Esc") return "collapse";
  if (state.expanded) return null;
  switch (key) {
    case "ArrowDown":
      return "next";
    case "ArrowUp":
      return "prev";
    case "Enter":
      return "expand";
    case " ":
    case "Spacebar":
      return "togglePause";
    default:
      return null;
  }
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("[data-gallery-ignore-keys]")) return true;
  const tag = target.tagName;
  return target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
