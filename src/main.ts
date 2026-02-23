import * as THREE from "three";
import CONFIG_JSON from "./config/config.json";

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
import { setFloor} from "./ui/floormanage";
import {
  enableFollow,
  disableFollow,
  isFollowing,
} from "./core/followmanage";
import { bindFreeController } from "./controls/freeController";


/* =============================
   MODE
============================= */

let cameraMode: CameraMode = "GESTURE";

const floorButtons = document.querySelectorAll<HTMLButtonElement>(".floor-btn");

floorButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const floor = Number(btn.textContent);

    const changed = setFloor(floor);
    if (!changed) return;
    disableFollow(); // กดเลือกชั้นเอง ถือว่าไม่อยากให้ตามตำแหน่งแล้ว
    // เปลี่ยน UI state
    floorButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // โหลด floor จริง
    loadFloor(scene, floor);
  });
});
/* =============================
   CONFIG
============================= */

const CONFIG = {
  ...CONFIG_JSON,
  PITCH: {
    ...CONFIG_JSON.PITCH,
    MAX: THREE.MathUtils.degToRad(CONFIG_JSON.PITCH.MAX_DEG),
  },
};

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
  zoomSpeed: 0.002,

  addYaw: (d) => {
    if (cameraMode === "GESTURE") {
      state.targetYaw += d;
    }
  },

  panSens: CONFIG.PAN.SENS,
  deadzone: CONFIG.PAN.DEADZONE,
});

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

  addYaw: (d) => {
    state.targetYaw += d;
  },

  addPitch: (d) => {
    state.targetPitch += d;  // 👈 ต้องมี targetPitch ใน camera state
  },

  moveSpeed: 0.1,
  rotateSens: 0.005,
});
/* =============================
   UI
============================= */

const ui = initUI({
  getMode: () => cameraMode,

  toggleMode: () => {
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

    if (cameraMode === "FREE") {
      disableFollow();
    }

    if (cameraMode === "GYRO") {
      gyro.enable();
      setBrowserZoomLock(true);
    } else {
      setBrowserZoomLock(false);
    }
  },

  getDebugInfo: () =>
    `ZOOM: ${camera.zoom.toFixed(2)}
HEIGHT: ${camera.position.y.toFixed(1)}
YAW: ${THREE.MathUtils.radToDeg(state.currentYaw).toFixed(1)}°`,

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

  getGPSInfo: gps.getInfo,

  isFollowing: () => isFollowing(), // 👈 ส่งเข้า UI
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
  const location = await fetchLocation();
  handleLocation(location);

  startLocationPolling(handleLocation);

  animate();
}

init();
