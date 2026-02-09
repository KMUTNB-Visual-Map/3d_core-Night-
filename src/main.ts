import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/* =====================================================
   PREVENT BROWSER ZOOM / SCROLL
===================================================== */
preventZoom();
function preventZoom() {
  document.body.style.touchAction = "none";
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.height = "100vh";

  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    { passive: false }
  );
  window.addEventListener("scroll", () => window.scrollTo(0, 0));
}

/* =====================================================
   SCENE
===================================================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaec6cf);
scene.add(new THREE.AxesHelper(2));
scene.add(new THREE.AmbientLight(0xfffff0, 1));

/* =====================================================
   CAMERA
===================================================== */
const BASE_ROTATION = new THREE.Euler(0, 0, 0, "YXZ");

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 10, 0);

/* =====================================================
   CONFIG
===================================================== */
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.12;

const HEIGHT_MIN = 10;
const HEIGHT_MAX = 150;

const PITCH_MIN = 0;
const PITCH_MAX = -Math.PI / 2;

const FOV_MIN = 60;
const FOV_MAX = 100;

// smooth
const ZOOM_DAMP = 10;
const HEIGHT_DAMP = 8;
const PITCH_DAMP = 10;
const FOV_DAMP = 10;
const YAW_DAMP = 8;

// pan
const PAN_SENS = 0.005;
const PAN_DEADZONE = 2;

/* =====================================================
   STATE
===================================================== */
let targetZoom = 1;

let targetYaw = 0; // unbounded
let currentYaw = 0;

let targetPitch = 0;
let targetHeight = HEIGHT_MIN;
let targetFov = FOV_MIN;

// gyro
let lastGyroAlpha: number | null = null;

// pc mouse pan
let isMousePanning = false;
let lastMouseX = 0;

camera.zoom = targetZoom;
camera.fov = targetFov;
camera.updateProjectionMatrix();

/* =====================================================
   RENDERER
===================================================== */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

/* =====================================================
   OVERLAY
===================================================== */
const overlay = document.createElement("div");
Object.assign(overlay.style, {
  position: "fixed",
  top: "12px",
  left: "12px",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  padding: "8px 10px",
  borderRadius: "6px",
  fontFamily: "monospace",
  fontSize: "12px",
  pointerEvents: "none",
  zIndex: "9999",
});
document.body.appendChild(overlay);

/* =====================================================
   MODE TOGGLE
===================================================== */
type CameraMode = "GYRO" | "GESTURE";
let cameraMode: CameraMode = "GYRO";

const btn = document.createElement("button");
btn.innerText = "MODE: GYRO";
Object.assign(btn.style, {
  position: "fixed",
  bottom: "16px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#222",
  color: "#fff",
  fontSize: "14px",
  zIndex: "9999",
});
document.body.appendChild(btn);

btn.onclick = () => {
  cameraMode = cameraMode === "GYRO" ? "GESTURE" : "GYRO";
  btn.innerText = `MODE: ${cameraMode}`;
};

/* =====================================================
   LOAD MODEL
===================================================== */
new GLTFLoader().load("/models/city.glb", (gltf) => {
  scene.add(gltf.scene);
});

/* =====================================================
   GYRO (DELTA + UNWRAP)
===================================================== */
function onDeviceOrientation(e: DeviceOrientationEvent) {
  if (cameraMode !== "GYRO") return;
  if (e.alpha == null) return;

  const alpha = THREE.MathUtils.degToRad(e.alpha);

  if (lastGyroAlpha === null) {
    lastGyroAlpha = alpha;
    return;
  }

  let delta = alpha - lastGyroAlpha;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;

  targetYaw += delta;
  lastGyroAlpha = alpha;
}

window.addEventListener(
  "click",
  () => {
    // @ts-ignore
    DeviceOrientationEvent?.requestPermission?.().then((s: string) => {
      if (s === "granted") {
        window.addEventListener("deviceorientation", onDeviceOrientation);
      }
    }) ?? window.addEventListener("deviceorientation", onDeviceOrientation);
  },
  { once: true }
);

/* =====================================================
   MOBILE TOUCH (PAN / ZOOM)
===================================================== */
let isTouchPanning = false;
let lastPanX = 0;
let lastPinchDist: number | null = null;

function pinchDist(t: TouchList) {
  const dx = t[0].clientX - t[1].clientX;
  const dy = t[0].clientY - t[1].clientY;
  return Math.hypot(dx, dy);
}

window.addEventListener("touchstart", (e) => {
  if (cameraMode !== "GESTURE") return;

  if (e.touches.length === 1) {
    isTouchPanning = true;
    lastPanX = e.touches[0].clientX;
  }

  if (e.touches.length === 2) {
    isTouchPanning = false;
    lastPinchDist = pinchDist(e.touches);
  }
});

window.addEventListener(
  "touchmove",
  (e) => {
    if (cameraMode !== "GESTURE") return;
    e.preventDefault();

    if (e.touches.length === 1 && isTouchPanning) {
      const dx = e.touches[0].clientX - lastPanX;
      lastPanX = e.touches[0].clientX;

      if (Math.abs(dx) > PAN_DEADZONE) {
        targetYaw -= dx * PAN_SENS;
      }
    }

    if (e.touches.length === 2 && lastPinchDist !== null) {
      const d = pinchDist(e.touches);
      targetZoom += (d - lastPinchDist) * 0.002;
      targetZoom = THREE.MathUtils.clamp(targetZoom, ZOOM_MIN, ZOOM_MAX);
      lastPinchDist = d;
    }
  },
  { passive: false }
);

window.addEventListener("touchend", () => {
  isTouchPanning = false;
  lastPinchDist = null;
});

/* =====================================================
   PC MOUSE PAN
===================================================== */
window.addEventListener("mousedown", (e) => {
  if (cameraMode !== "GESTURE") return;
  if (e.button !== 0) return; // left click

  isMousePanning = true;
  lastMouseX = e.clientX;
});

window.addEventListener("mousemove", (e) => {
  if (!isMousePanning) return;
  if (cameraMode !== "GESTURE") return;

  const dx = e.clientX - lastMouseX;
  lastMouseX = e.clientX;

  if (Math.abs(dx) > PAN_DEADZONE) {
    targetYaw -= dx * PAN_SENS;
  }
});

window.addEventListener("mouseup", () => {
  isMousePanning = false;
});

/* =====================================================
   DESKTOP ZOOM
===================================================== */
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    targetZoom += e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    targetZoom = THREE.MathUtils.clamp(targetZoom, ZOOM_MIN, ZOOM_MAX);
  },
  { passive: false }
);

/* =====================================================
   RESIZE
===================================================== */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =====================================================
   HELPERS
===================================================== */
function normalizeAngle(rad: number) {
  return ((rad + Math.PI) % (Math.PI * 2)) - Math.PI;
}

/* =====================================================
   LOOP
===================================================== */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  currentYaw = THREE.MathUtils.damp(currentYaw, targetYaw, YAW_DAMP, dt);

  camera.zoom = THREE.MathUtils.damp(camera.zoom, targetZoom, ZOOM_DAMP, dt);

  const t = (camera.zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);

  targetHeight = THREE.MathUtils.lerp(HEIGHT_MIN, HEIGHT_MAX, t);
  targetPitch = THREE.MathUtils.lerp(PITCH_MIN, PITCH_MAX, t);
  targetFov = THREE.MathUtils.lerp(FOV_MIN, FOV_MAX, t);

  camera.position.y = THREE.MathUtils.damp(
    camera.position.y,
    targetHeight,
    HEIGHT_DAMP,
    dt
  );

  BASE_ROTATION.x = THREE.MathUtils.damp(
    BASE_ROTATION.x,
    targetPitch,
    PITCH_DAMP,
    dt
  );

  camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, FOV_DAMP, dt);

  camera.rotation.set(
    BASE_ROTATION.x,
    normalizeAngle(currentYaw),
    0,
    "YXZ"
  );

  camera.updateProjectionMatrix();

  overlay.innerText =
    `MODE: ${cameraMode}\n` +
    `ZOOM: ${camera.zoom.toFixed(2)}\n` +
    `FOV: ${camera.fov.toFixed(1)}°\n` +
    `HEIGHT: ${camera.position.y.toFixed(1)}\n` +
    `YAW: ${THREE.MathUtils.radToDeg(currentYaw).toFixed(1)}°`;

  renderer.render(scene, camera);
}

animate();
