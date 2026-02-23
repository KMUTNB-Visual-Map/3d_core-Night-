import * as THREE from "three";

export type CameraState = {
  targetZoom: number;
  targetYaw: number;
  currentYaw: number;
  targetX: number;
  targetZ: number;

  targetPitch: number;
  currentPitch: number;   // ✔ มีจริง ใช้งานจริง
};

export function createCamera(config: any) {
  const camera = new THREE.PerspectiveCamera(
    config.FOV.MIN,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );

  camera.position.set(0, config.HEIGHT.MIN, 0);

  const initialPitch = config.PITCH.MIN;

  const state: CameraState = {
    targetZoom: 1,
    targetYaw: 0,
    currentYaw: 0,
    targetX: 0,
    targetZ: 0,

    targetPitch: initialPitch,
    currentPitch: initialPitch,   // 🔥 ต้องมี
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

  /* ================= YAW ================= */

  state.currentYaw +=
    Math.atan2(
      Math.sin(state.targetYaw - state.currentYaw),
      Math.cos(state.targetYaw - state.currentYaw)
    ) *
    (1 - Math.exp(-config.YAW.DAMP * dt));

  /* ================= ZOOM ================= */

  camera.zoom = damp(
    camera.zoom,
    state.targetZoom,
    config.ZOOM.DAMP,
    dt
  );

  const t =
    (camera.zoom - config.ZOOM.MIN) /
    (config.ZOOM.MAX - config.ZOOM.MIN);

  /* ================= HEIGHT + FOV ================= */

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

  /* ================= BASE PITCH FROM ZOOM ================= */

  const basePitch = THREE.MathUtils.lerp(
    config.PITCH.MAX,  // zoom in
    config.PITCH.MIN,  // zoom out → top-down
    t
  );

  /* ================= FINAL PITCH ================= */

  const finalTargetPitch = THREE.MathUtils.clamp(
    basePitch + state.targetPitch,  // gesture offset
    config.PITCH.MIN,
    config.PITCH.MAX
  );

  state.currentPitch = damp(
    state.currentPitch,
    finalTargetPitch,
    config.PITCH.DAMP ?? 6,
    dt
  );

  /* ================= POSITION ================= */

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

  camera.fov = damp(
    camera.fov,
    targetFov,
    config.FOV.DAMP,
    dt
  );

  /* ================= ROTATION ================= */

  camera.rotation.set(
    state.currentPitch,
    state.currentYaw,
    0,
    "YXZ"
  );

  camera.updateProjectionMatrix();
}