import type * as ThreeModule from "three";
import { ORBIT_GUARDS } from "./defaults";
import { slotPose, type OrbitLayout } from "./orbit";

type Three = typeof ThreeModule;

const px = (v: number) => String(Math.round(v * 1000) / 1000);
const m = (v: number) => String(Math.round(v * 1e6) / 1e6);

/** Same Y-flip as three/examples CSS3DRenderer `getCameraCSSMatrix`. */
function cameraCssMatrix(matrix: ThreeModule.Matrix4) {
  const e = matrix.elements;
  return `matrix3d(${[e[0], -e[1], e[2], e[3], e[4], -e[5], e[6], e[7], e[8], -e[9], e[10], e[11], e[12], -e[13], e[14], e[15]].map(m).join(",")})`;
}

/** Same Y-flip as three/examples CSS3DRenderer `getObjectCSSMatrix`. */
function objectCssMatrix(matrix: ThreeModule.Matrix4) {
  const e = matrix.elements;
  return `translate(-50%,-50%)matrix3d(${[e[0], e[1], e[2], e[3], -e[4], -e[5], -e[6], -e[7], e[8], e[9], e[10], e[11], e[12], e[13], e[14], e[15]].map(m).join(",")})`;
}

/**
 * s.page-style orbit: a Three.js camera + Object3D compute poses, React-owned DOM cards receive them as CSS matrix3d
 * (the CSS3DRenderer projection, without letting three move React's nodes around).
 */
export function createOrbitScene(THREE: Three, cameraElement: HTMLElement) {
  const camera = new THREE.PerspectiveCamera();
  const card = new THREE.Object3D();
  let layout: OrbitLayout | null = null;

  return {
    setLayout(next: OrbitLayout) {
      layout = next;
      camera.fov = next.fovDeg;
      camera.aspect = next.height > 0 ? next.width / next.height : 1;
      camera.near = 1;
      camera.far = next.perspective + next.radius * 2 + next.height * 10;
      camera.position.set(0, 0, next.perspective);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      const fovPx = camera.projectionMatrix.elements[5] * (next.height / 2);
      cameraElement.style.width = `${next.width}px`;
      cameraElement.style.height = `${next.height}px`;
      cameraElement.style.transform =
        `perspective(${px(fovPx)}px) translateZ(${px(fovPx)}px)` +
        cameraCssMatrix(camera.matrixWorldInverse) +
        `translate(${px(next.width / 2)}px,${px(next.height / 2)}px)`;
    },

    poseCard(element: HTMLElement, offset: number) {
      if (!layout) return;
      const pose = slotPose(offset, layout);
      card.position.set(0, pose.y, pose.z);
      card.rotation.set(pose.rotationX, 0, 0);
      card.updateMatrixWorld(true);
      const visible = Math.abs(offset) < ORBIT_GUARDS.renderWindow && Math.abs(pose.angle) < Math.PI / 2;
      element.style.transform = objectCssMatrix(card.matrixWorld);
      element.style.visibility = visible ? "visible" : "hidden";
      element.style.zIndex = String(1000 - Math.round(Math.abs(offset) * 100));
    },
  };
}

export type OrbitScene = ReturnType<typeof createOrbitScene>;
