import * as THREE from "three";

export type CameraState = {
  targetZoom: number;

  targetYaw: number;
  currentYaw: number;

  targetX: number;
  targetZ: number;

  targetPitch: number;
  currentPitch: number;

  targetHeight: number;
  currentHeight: number;
};

export function createCamera(config: any) {
  const camera = new THREE.PerspectiveCamera(
    config.FOV.MIN,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );

  const initialHeight = config.HEIGHT.MIN;
  const initialPitch = config.PITCH.MIN;

  camera.position.set(0, initialHeight, 0);

  const state: CameraState = {
    targetZoom: 1,

    targetYaw: 0,
    currentYaw: 0,

    targetX: 0,
    targetZ: 0,

    targetPitch: initialPitch,
    currentPitch: initialPitch,

    targetHeight: initialHeight,
    currentHeight: initialHeight,
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

  /* ================= HEIGHT FROM ZOOM ================= */

  state.targetHeight = THREE.MathUtils.lerp(
    config.HEIGHT.MIN,
    config.HEIGHT.MAX,
    t
  );

  state.currentHeight = damp(
    state.currentHeight,
    state.targetHeight,
    config.HEIGHT.DAMP,
    dt
  );

  camera.position.y = state.currentHeight;

  /* ================= FOV ================= */

  const targetFov = THREE.MathUtils.lerp(
    config.FOV.MIN,
    config.FOV.MAX,
    t
  );

  camera.fov = damp(
    camera.fov,
    targetFov,
    config.FOV.DAMP,
    dt
  );

  /* ================= BASE PITCH FROM ZOOM ================= */

  const basePitch = THREE.MathUtils.lerp(
    config.PITCH.MAX,
    config.PITCH.MIN,
    t
  );

  const finalTargetPitch = THREE.MathUtils.clamp(
    basePitch + state.targetPitch,
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

  /* ================= ROTATION ================= */

  camera.rotation.set(
    state.currentPitch,
    state.currentYaw,
    0,
    "YXZ"
  );

  camera.updateProjectionMatrix();
}