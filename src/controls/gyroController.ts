import * as THREE from "three";

type GyroOptions = {
  isActive: () => boolean;
  setTargetYaw: (yaw: number) => void;
  setDebugAlpha: (alpha: number) => void;
};

export function bindGyro(options: GyroOptions) {
  function handleOrientation(e: DeviceOrientationEvent) {
    if (!options.isActive()) return;
    if (e.alpha == null) return;

    const alphaRad = THREE.MathUtils.degToRad(e.alpha);

    options.setDebugAlpha(alphaRad);
    options.setTargetYaw(alphaRad);
  }

  window.addEventListener("deviceorientation", handleOrientation);

  return {
    dispose() {
      window.removeEventListener("deviceorientation", handleOrientation);
    },
  };
}
