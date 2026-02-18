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

/* =============================
   MODE
============================= */

let cameraMode: CameraMode = "GESTURE";

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

  if (floor !== currentFloor) {
    loadFloor(scene, floor);
    currentFloor = floor;
  }

  const pos = mapToWorld(x, y, floor);
  state.targetX = pos.x;
  state.targetZ = pos.z;
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
  isActive: () => true, // zoom ใช้ได้ทุก mode

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

/* =============================
   UI
============================= */

const ui = initUI({
  getMode: () => cameraMode,

  toggleMode: () => {
    cameraMode = cameraMode === "GYRO" ? "GESTURE" : "GYRO";

    if (cameraMode === "GYRO") {
      gyro.enable(); // ขอ permission ตอน user กด
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

  onRequestGPS: gps.request,

  getGPSInfo: gps.getInfo,
});

/* =============================
   LOOP
============================= */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

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
