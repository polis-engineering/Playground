import { describe, expect, it } from "vitest";
import { keyToAction } from "@/lib/gallery/keyboard";

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
