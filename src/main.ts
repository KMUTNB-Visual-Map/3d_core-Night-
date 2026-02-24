import * as THREE from "three";
import CONFIG_JSON from "./config/config.json";
import STATE_JSON from "./config/state.json";

import { setBrowserZoomLock } from "./core/browserlock";
import { createScene } from "./core/scene";
import { createCamera, updateCamera } from "./core/camera";
import { mapToWorld } from "./core/world";
import { loadFloor } from "./core/floorloader";
import { fetchLocation, startLocationPolling } from "./core/locationservice";
import { createGPSService } from "./core/gpsservice";

import { bindGyro } from "./controls/gyroController";
import { bindGesture } from "./controls/gestureController";
import { initUI, type CameraMode } from "./ui/ui";
import { setFloor } from "./ui/floormanage";
import {
  enableFollow,
  disableFollow,
  isFollowing,
} from "./core/followmanage";
import { bindFreeController } from "./controls/freeController";

/* =============================
   MODE
============================= */

function mapStateToMode(state: number): CameraMode {
  switch (state) {
    case 1:
      return "GYRO";
    case 2:
      return "FREE";
    default:
      return "FREE";
  }
}

let cameraMode: CameraMode = mapStateToMode(STATE_JSON.state);

/* =============================
   CONFIG WRAPPER
============================= */

const CONFIG = {
  ...CONFIG_JSON,
  PITCH: {
    ...CONFIG_JSON.PITCH,
    MAX: THREE.MathUtils.degToRad(CONFIG_JSON.PITCH.MAX_DEG),
  },
};

/* =============================
   iOS GYRO PERMISSION
============================= */

async function requestGyroPermissionIfNeeded(): Promise<boolean> {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof (DeviceOrientationEvent as any).requestPermission === "function"
  ) {
    try {
      const response = await (DeviceOrientationEvent as any).requestPermission();
      return response === "granted";
    } catch {
      return false;
    }
  }

  return true;
}

/* =============================
   FLOOR BUTTON
============================= */

const floorButtons =
  document.querySelectorAll<HTMLButtonElement>(".floor-btn");

function updateFloorButtons(floor: number) {
  floorButtons.forEach((btn) => {
    const btnFloor = Number(btn.textContent);
    btn.classList.toggle("active", btnFloor === floor);
  });
}

floorButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const floor = Number(btn.textContent);

    const changed = setFloor(floor);
    if (!changed) return;

    disableFollow();
    updateFloorButtons(floor);

    loadFloor(scene, floor);
    currentFloor = floor;
  });
});

/* =============================
   CORE SETUP
============================= */

const { scene, renderer } = createScene();
const { camera, state } = createCamera(CONFIG);

scene.add(camera);

/* =============================
   FLOOR STATE
============================= */

let currentFloor: number | null = null;

function handleLocation(location: any) {
  const { x, y, floor } = location;

  if (isFollowing() && floor !== currentFloor) {
    loadFloor(scene, floor);
    currentFloor = floor;
    updateFloorButtons(floor);
  }

  const pos = mapToWorld(x, y, floor);

  if (isFollowing()) {
    state.targetX = pos.x;
    state.targetZ = pos.z;
  }
}

/* =============================
   GPS SERVICE
============================= */

const gps = createGPSService();

/* =============================
   CONTROLLERS
============================= */

const gyro = bindGyro({
  isActive: () => cameraMode === "GYRO",
  setYaw: (yaw) => (state.targetYaw = yaw),
});

bindGesture({
  isActive: () =>
    cameraMode === "GESTURE" ||
    cameraMode === "GYRO",

  getZoom: () => state.targetZoom,
  setZoom: (z) => (state.targetZoom = z),

  zoomMin: CONFIG.ZOOM.MIN,
  zoomMax: CONFIG.ZOOM.MAX,
  zoomSpeed: CONFIG.GESTURE.ZOOM_SPEED,

  addYaw: (d) => {
    if (cameraMode === "GESTURE") {
      state.targetYaw += d;
    }
  },

  panSens: CONFIG.PAN.SENS,
  deadzone: CONFIG.PAN.DEADZONE,
});

/* =============================
   FREE CONTROLLER
============================= */

const free = bindFreeController({
  isActive: () => cameraMode === "FREE",

  getPosition: () => ({
    x: state.targetX,
    z: state.targetZ,
  }),

  setPosition: (x, z) => {
    state.targetX = x;
    state.targetZ = z;
  },

  getYaw: () => state.targetYaw,
  getPitch: () => state.targetPitch,

  addYaw: (d) => {
    state.targetYaw += d;
  },

  addPitch: (d) => {
    state.targetPitch += d;
  },

  getHeight: () => state.targetHeight,
  setHeight: (h) => (state.targetHeight = h),

  moveSpeed: CONFIG.FREE_CONTROL.MOVE_SPEED,
  rotateSens: CONFIG.FREE_CONTROL.ROTATE_SENS,
  zoomSens: CONFIG.FREE_CONTROL.ZOOM_SENS,
});

/* =============================
   MODE SIDE EFFECT
============================= */

async function applyModeSideEffect(fromUser = false) {
  if (cameraMode === "FREE") {
    disableFollow();
  }

  if (cameraMode === "GYRO") {
    if (fromUser) {
      const granted = await requestGyroPermissionIfNeeded();
      if (!granted) {
        console.warn("Gyro permission denied");
        cameraMode = "GESTURE";
        return;
      }
    }

    gyro.enable();
    setBrowserZoomLock(true);
  } else {
    setBrowserZoomLock(false);
  }
}

/* =============================
   UI
============================= */

const ui = initUI({
  getMode: () => cameraMode,

  toggleMode: async () => {
    switch (cameraMode) {
      case "GESTURE":
        cameraMode = "FREE";
        break;
      case "FREE":
        cameraMode = "GYRO";
        break;
      case "GYRO":
        cameraMode = "GESTURE";
        break;
    }

    await applyModeSideEffect(true);
  },

  getDebugInfo: () =>
    `ZOOM: ${camera.zoom.toFixed(2)}
HEIGHT: ${camera.position.y.toFixed(1)}
YAW: ${THREE.MathUtils.radToDeg(
      state.currentYaw
    ).toFixed(1)}°`,

  getPosition: () => ({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  }),

  onRequestGPS: async () => {
    await gps.request();

    const following = isFollowing();

    if (following) {
      disableFollow();
      return;
    }

    enableFollow();

    const location = await fetchLocation();
    handleLocation(location);
  },

  getYawDeg: () =>
    THREE.MathUtils.radToDeg(state.currentYaw),

  getPitchDeg: () =>
    THREE.MathUtils.radToDeg(state.currentPitch),

  getGPSInfo: gps.getInfo,
  isFollowing: () => isFollowing(),
});

/* =============================
   LOOP
============================= */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  free.update();
  updateCamera(camera, state, CONFIG, dt);

  ui.update();
  renderer.render(scene, camera);
}

/* =============================
   INIT
============================= */

async function init() {
  if (cameraMode !== "GYRO") {
    await applyModeSideEffect(false);
  }

  const location = await fetchLocation();
  handleLocation(location);

  startLocationPolling(handleLocation);

  animate();
}

init();