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

describe("createOrbitScene", () => {
  it("puts the camera at the perspective distance, origin at viewport center", () => {
    const camera = stub();
    createOrbitScene(THREE, camera).setLayout(layout);
    const d = String(Math.round(layout.perspective * 1000) / 1000);
    expect(camera.style.transform.startsWith(`perspective(${d}px) translateZ(${d}px)`)).toBe(true);
    expect(camera.style.transform).toContain("translate(756px,491px)");
  });

  it("renders the center card face-on", () => {
    const scene = createOrbitScene(THREE, stub());
    scene.setLayout(layout);
    const card = stub();
    scene.poseCard(card, 0);
    expect(card.style.visibility).toBe("visible");
    expect(card.style.transform).toBe("translate(-50%,-50%)matrix3d(1,0,0,0,0,-1,0,0,0,0,1,0,0,0,0,1)");
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
