import { describe, expect, it } from "vitest";
import { keyToAction, shouldHandleGalleryKey } from "@/lib/gallery/keyboard";

type Fake = { tagName: string; isContentEditable?: boolean; ignore?: boolean };
const el = ({ tagName, isContentEditable = false, ignore = false }: Fake) =>
  ({
    tagName,
    isContentEditable,
    closest: (sel: string) => (ignore && sel === "[data-gallery-ignore-keys]" ? {} : null),
  }) as unknown as EventTarget;

describe("shouldHandleGalleryKey", () => {
  const inside = el({ tagName: "DIV" });
  const button = el({ tagName: "BUTTON" });
  const root = { contains: (t: unknown) => t === inside };

  it("handles keys when focus is on the page body", () => {
    expect(shouldHandleGalleryKey(el({ tagName: "BODY" }), root)).toBe(true);
  });

  it("handles keys when focus is inside the gallery", () => {
    expect(shouldHandleGalleryKey(inside, root)).toBe(true);
  });

  it("leaves other focused controls alone (native Enter/Space)", () => {
    expect(shouldHandleGalleryKey(button, root)).toBe(false);
  });

  it("ignores form fields and opted-out subtrees", () => {
    expect(shouldHandleGalleryKey(el({ tagName: "INPUT" }), root)).toBe(false);
    expect(shouldHandleGalleryKey(el({ tagName: "DIV", isContentEditable: true }), root)).toBe(false);
    expect(shouldHandleGalleryKey(el({ tagName: "BODY", ignore: true }), root)).toBe(false);
  });

  it("handles keys with no target", () => {
    expect(shouldHandleGalleryKey(null, root)).toBe(true);
  });
});

describe("keyToAction (spec §6)", () => {
  const idle = { expanded: false };
  const open = { expanded: true };

  it("maps arrows to next / previous", () => {
    expect(keyToAction("ArrowDown", idle)).toBe("next");
    expect(keyToAction("ArrowUp", idle)).toBe("prev");
  });

  it("maps Enter to expand", () => {
    expect(keyToAction("Enter", idle)).toBe("expand");
  });

  it("maps Escape to collapse", () => {
    expect(keyToAction("Escape", idle)).toBe("collapse");
    expect(keyToAction("Escape", open)).toBe("collapse");
  });

  it("maps Space to pause toggle", () => {
    expect(keyToAction(" ", idle)).toBe("togglePause");
    expect(keyToAction("Spacebar", idle)).toBe("togglePause");
  });

  it("locks navigation and expand while expanded", () => {
    expect(keyToAction("ArrowDown", open)).toBeNull();
    expect(keyToAction("ArrowUp", open)).toBeNull();
    expect(keyToAction("Enter", open)).toBeNull();
    expect(keyToAction(" ", open)).toBeNull();
  });

  it("ignores other keys", () => {
    expect(keyToAction("a", idle)).toBeNull();
  });
});
