import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { computeOrbitLayout } from "@/lib/gallery/orbit";
import { createOrbitScene } from "@/lib/gallery/orbitScene";

const stub = () => ({ style: {} as Record<string, string> }) as unknown as HTMLElement;

const layout = computeOrbitLayout({
  width: 1512,
  height: 982,
  cardHeight: 452,
  itemCount: 3,
  peekRatio: 0.33,
  radius: "auto",
  minVirtualSlots: 12,
  perspectiveFov: "auto",
});

const d = String(Math.round(layout.perspective * 1000) / 1000);

describe("createOrbitScene", () => {
  it("sizes the (flat) camera container to the viewport", () => {
    const camera = stub();
    createOrbitScene(THREE, camera).setLayout(layout);
    expect(camera.style.width).toBe("1512px");
    expect(camera.style.height).toBe("982px");
  });

  it("projects each card on its own (no shared preserve-3d depth sort)", () => {
    const scene = createOrbitScene(THREE, stub());
    scene.setLayout(layout);
    const card = stub();
    scene.poseCard(card, 0);
    expect(card.style.transform.startsWith(`translate(756px,491px) perspective(${d}px) translateZ(${d}px)`)).toBe(true);
    expect(card.style.transform.endsWith("translate(-50%,-50%)")).toBe(true);
    expect(card.style.transformOrigin).toBe("0 0");
  });

  it("renders the center card face-on at scale 1", () => {
    const scene = createOrbitScene(THREE, stub());
    scene.setLayout(layout);
    const card = stub();
    scene.poseCard(card, 0);
    expect(card.style.visibility).toBe("visible");
    expect(card.style.transform).toContain("matrix3d(1,0,0,0,0,-1,0,0,0,0,1,0,0,0,0,1)translate(-50%,-50%)");
  });

  it("hides cards outside the ±2 render window", () => {
    const scene = createOrbitScene(THREE, stub());
    scene.setLayout(layout);
    const card = stub();
    scene.poseCard(card, 2);
    expect(card.style.visibility).toBe("hidden");
    scene.poseCard(card, 1.5);
    expect(card.style.visibility).toBe("visible");
  });

  it("hides a card that would cross the camera's near plane", () => {
    const scene = createOrbitScene(THREE, stub());
    scene.setLayout({ ...layout, radius: layout.perspective * 20 });
    const card = stub();
    scene.poseCard(card, 1);
    expect(card.style.visibility).toBe("hidden");
  });

  it("stacks the center card above its neighbours", () => {
    const scene = createOrbitScene(THREE, stub());
    scene.setLayout(layout);
    const center = stub();
    const top = stub();
    scene.poseCard(center, 0);
    scene.poseCard(top, -1);
    expect(Number(center.style.zIndex)).toBeGreaterThan(Number(top.style.zIndex));
  });
});
