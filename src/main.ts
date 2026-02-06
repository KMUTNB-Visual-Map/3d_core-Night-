import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/* ======================
   SCENE
====================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaec6cf);

/* ======================
   CAMERA
====================== */
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

// ตำแหน่งคงที่ (ไม่เดิน)
camera.position.set(4.7, 0.4, -4.2);
// Default: rotate camera +90° around Y-axis
camera.rotation.x = Math.PI / 2;

/* ======================
   RENDERER
====================== */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// OVERLAY: show camera rotation in degrees (top-right)
const rotationOverlay = document.createElement("div");
rotationOverlay.style.position = "fixed";
rotationOverlay.style.top = "12px";
rotationOverlay.style.right = "12px";
rotationOverlay.style.background = "rgba(0,0,0,0.6)";
rotationOverlay.style.color = "#fff";
rotationOverlay.style.padding = "8px 10px";
rotationOverlay.style.borderRadius = "6px";
rotationOverlay.style.fontFamily = "monospace, monospace";
rotationOverlay.style.fontSize = "13px";
rotationOverlay.style.lineHeight = "1.2";
rotationOverlay.style.zIndex = "9999";
rotationOverlay.style.pointerEvents = "none";
rotationOverlay.innerText = "X: 0°\nY: 0°\nZ: 0°";
document.body.appendChild(rotationOverlay);

/* ======================
   LIGHT
====================== */
scene.add(new THREE.AmbientLight(0xffffff, 1));

/* ======================
   LOAD GLB
====================== */
const loader = new GLTFLoader();
loader.load("/models/city.glb", (gltf) => {
  scene.add(gltf.scene);
  console.log("GLB loaded ✅");
});

/* ======================
   GYRO / DEVICE ORIENTATION
====================== */

// ขอ permission (จำเป็นมากสำหรับ iOS)
function requestGyroPermission() {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    // @ts-ignore
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    // iOS
    // @ts-ignore
    DeviceOrientationEvent.requestPermission().then((state: string) => {
      if (state === "granted") {
        window.addEventListener("deviceorientation", onDeviceOrientation);
        console.log("Gyro permission granted ✅");
      }
    });
  } else {
    // Android / Desktop
    window.addEventListener("deviceorientation", onDeviceOrientation);
    console.log("Gyro permission auto-enabled ✅");
  }
}

// Helpers and state for mapping DeviceOrientation -> Three.js quaternion
const euler = new THREE.Euler(0, 0, 0, "YXZ");
const zee = new THREE.Vector3(0, 0, 1);
const q0 = new THREE.Quaternion();
// -PI/2 around the X axis to make the camera look out the back of the device
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

function getScreenOrientation() {
  if (typeof window.screen !== "undefined" && (window.screen as any).orientation && typeof (window.screen as any).orientation.angle === 'number') {
    return (window.screen as any).orientation.angle as number;
  }
  // fallback for older browsers
  // @ts-ignore
  return (window.orientation as number) || 0;
}

function setObjectQuaternion(quaternion: THREE.Quaternion, alpha: number, beta: number, gamma: number, orient: number) {
  euler.set(beta, alpha, -gamma, 'YXZ');
  quaternion.setFromEuler(euler); // orient the device
  quaternion.multiply(q1); // camera looks out the back of the device, not the top
  quaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // adjust for screen orientation
}

function onDeviceOrientation(event: DeviceOrientationEvent) {
  if (event.alpha === null || event.beta === null || event.gamma === null) {
    return;
  }
  const alpha = THREE.MathUtils.degToRad(event.alpha); // Z
  const beta = THREE.MathUtils.degToRad(event.beta);   // X'
  const gamma = THREE.MathUtils.degToRad(event.gamma); // Y'
  const orient = THREE.MathUtils.degToRad(getScreenOrientation());

  setObjectQuaternion(camera.quaternion, alpha, beta, gamma, orient);
}

// ต้องให้ user interaction สักครั้ง
window.addEventListener("click", requestGyroPermission, { once: true });

/* ======================
   RESIZE
====================== */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ======================
   RENDER LOOP
====================== */
function animate() {
  requestAnimationFrame(animate);
  // Update overlay with camera rotation in degrees
  const deg = THREE.MathUtils.radToDeg;
  const rx = deg(camera.rotation.x);
  const ry = deg(camera.rotation.y);
  const rz = deg(camera.rotation.z);
  rotationOverlay.innerText = `X: ${rx.toFixed(1)}°\nY: ${ry.toFixed(1)}°\nZ: ${rz.toFixed(1)}°`;

  renderer.render(scene, camera);
}
animate();