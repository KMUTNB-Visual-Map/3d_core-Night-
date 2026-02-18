import * as THREE from "three";

type GyroOptions = {
  isActive: () => boolean;
  setYaw: (yaw: number) => void;
};

export function bindGyro(options: GyroOptions) {
  let enabled = false;

  async function requestPermissionIfNeeded(): Promise<boolean> {
    const anyOrientation = DeviceOrientationEvent as any;

    if (typeof anyOrientation?.requestPermission === "function") {
      try {
        const response = await anyOrientation.requestPermission();
        return response === "granted";
      } catch {
        return false;
      }
    }

    // Android / Desktop
    return true;
  }

  function handleOrientation(e: DeviceOrientationEvent) {
    if (!options.isActive()) return;
    if (e.alpha == null) return;

    const alphaRad = THREE.MathUtils.degToRad(e.alpha);
    options.setYaw(alphaRad);
  }

  async function enable() {
    if (enabled) return;

    const granted = await requestPermissionIfNeeded();
    if (!granted) {
      console.warn("Gyro permission denied");
      return;
    }

    window.addEventListener("deviceorientation", handleOrientation);
    enabled = true;
  }

  function dispose() {
    window.removeEventListener("deviceorientation", handleOrientation);
    enabled = false;
  }

  return {
    enable,
    dispose,
  };
}
