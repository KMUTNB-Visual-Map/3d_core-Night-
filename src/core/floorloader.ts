import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FLOOR_HEIGHT } from "./world";

let activeFloor: THREE.Object3D | null = null;

export function loadFloor(scene: THREE.Scene, floor: number) {
  const loader = new GLTFLoader();
  const path = `/models/archif${floor}.glb`;

  loader.load(
    path,
    (gltf) => {
      if (activeFloor) {
        scene.remove(activeFloor);
        activeFloor.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m: THREE.Material) => m.dispose());
            } else obj.material.dispose();
          }
        });
      }

      activeFloor = gltf.scene;
      activeFloor.position.y = floor * FLOOR_HEIGHT;
      scene.add(activeFloor);
    },
    undefined,
    () => {
      console.warn(`Failed to load ${path}`);
    }
  );
}
