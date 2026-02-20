import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FLOOR_HEIGHT } from "./world";

let activeFloor: THREE.Object3D | null = null;

// เก็บขนาดหลัง scale ไว้ใช้ mapping
export let currentModelSize = {
  width: 0,
  depth: 0,
};

export function loadFloor(scene: THREE.Scene, floor: number) {
  const loader = new GLTFLoader();
  const path = `/models/archif${floor}.glb`;

  loader.load(
    path,
    (gltf) => {
      /* =============================
         Remove old floor
      ============================= */

      if (activeFloor) {
        scene.remove(activeFloor);

        activeFloor.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();

          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m: THREE.Material) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }

      /* =============================
         Set new floor
      ============================= */

      activeFloor = gltf.scene;

      /* =============================
         Compute bounding box
      ============================= */

      const box = new THREE.Box3().setFromObject(activeFloor);
      const size = new THREE.Vector3();
      box.getSize(size);

      // หาด้านที่ยาวที่สุด (X หรือ Z)
      const longestSide = Math.max(size.x, size.z);
      const targetLength = 100; // ด้านยาว = 100 หน่วย

      const scaleFactor = targetLength / longestSide;

      // scale model
      activeFloor.scale.setScalar(scaleFactor);

      /* =============================
         Recompute size after scale
      ============================= */

      const scaledBox = new THREE.Box3().setFromObject(activeFloor);
      const scaledSize = new THREE.Vector3();
      scaledBox.getSize(scaledSize);

      currentModelSize.width = scaledSize.x;
      currentModelSize.depth = scaledSize.z;

      console.log("Scaled model size:", currentModelSize);

      /* =============================
         Position floor
      ============================= */

      activeFloor.position.y = floor * FLOOR_HEIGHT;

      scene.add(activeFloor);
    },
    undefined,
    () => {
      console.warn(`Failed to load ${path}`);
    }
  );
}
