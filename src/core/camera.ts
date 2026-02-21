import * as THREE from "three";

export type CameraState = {
  targetZoom: number;
  targetYaw: number;
  currentYaw: number;
  targetX: number;
  targetZ: number;
  targetPitch: number;   // ✔ มีอยู่แล้ว
};

export function createCamera(config: any) {
  const camera = new THREE.PerspectiveCamera(
    config.FOV.MIN,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );

  camera.position.set(0, config.HEIGHT.MIN, 0);

  const state: CameraState = {
    targetZoom: 1,
    targetYaw: 0,
    currentYaw: 0,
    targetX: 0,
    targetZ: 0,
    targetPitch: config.PITCH.MIN, // 🔥 ใส่ค่าเริ่มต้น
  };

  return { camera, state };
}

export function updateCamera(
  camera: THREE.PerspectiveCamera,
  state: CameraState,
  config: any,
  dt: number
) {
  const damp = THREE.MathUtils.damp;

  // ================= YAW =================

  state.currentYaw +=
    Math.atan2(
      Math.sin(state.targetYaw - state.currentYaw),
      Math.cos(state.targetYaw - state.currentYaw)
    ) *
    (1 - Math.exp(-config.YAW.DAMP * dt));

  // ================= PITCH (clamp) =================

  state.targetPitch = THREE.MathUtils.clamp(
    state.targetPitch,
    config.PITCH.MIN,
    config.PITCH.MAX
  );

  // ================= ZOOM =================

  camera.zoom = damp(camera.zoom, state.targetZoom, config.ZOOM.DAMP, dt);

  const t =
    (camera.zoom - config.ZOOM.MIN) /
    (config.ZOOM.MAX - config.ZOOM.MIN);

  const targetHeight = THREE.MathUtils.lerp(
    config.HEIGHT.MIN,
    config.HEIGHT.MAX,
    t
  );

  const targetFov = THREE.MathUtils.lerp(
    config.FOV.MIN,
    config.FOV.MAX,
    t
  );

  // ================= POSITION =================

  camera.position.y = damp(
    camera.position.y,
    targetHeight,
    config.HEIGHT.DAMP,
    dt
  );

  camera.position.x = damp(
    camera.position.x,
    state.targetX,
    config.CAMERA.DAMP,
    dt
  );

  camera.position.z = damp(
    camera.position.z,
    state.targetZ,
    config.CAMERA.DAMP,
    dt
  );

  camera.fov = damp(camera.fov, targetFov, config.FOV.DAMP, dt);

  // ================= FINAL ROTATION =================

  camera.rotation.set(
    state.targetPitch,   // 🔥 ใช้ค่าจาก gesture จริง
    state.currentYaw,
    0,
    "YXZ"
  );

  camera.updateProjectionMatrix();
}