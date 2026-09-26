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

type ElementLike = { tagName: string; isContentEditable?: boolean; closest(selector: string): unknown };

const asElement = (target: EventTarget | null) =>
  target && typeof (target as Partial<ElementLike>).closest === "function" ? (target as unknown as ElementLike) : null;

export function isEditableTarget(target: EventTarget | null) {
  const el = asElement(target);
  if (!el) return false;
  if (el.closest("[data-gallery-ignore-keys]")) return true;
  const tag = el.tagName;
  return Boolean(el.isContentEditable) || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Keys act on the gallery only when focus is on the page itself or inside the gallery, so Enter/Space keep their
 * native meaning on any other focused control.
 */
export function shouldHandleGalleryKey(target: EventTarget | null, root: { contains(node: unknown): boolean } | null) {
  if (isEditableTarget(target)) return false;
  const el = asElement(target);
  if (!el || el.tagName === "BODY" || el.tagName === "HTML") return true;
  return Boolean(root?.contains(el));
}
