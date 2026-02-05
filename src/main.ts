import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/* ======================
  SCENE
====================== */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

camera.position.set(0.01, 0.10, 0.30);
camera.lookAt(0, 0, 0);

/* ======================
  RENDERER
====================== */
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

/* ======================
   CONTROLS
   CAMERA INFO UI
====================== */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
const cameraInfoDiv = document.createElement("div");
cameraInfoDiv.id = "camera-info";
cameraInfoDiv.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #00ff00;
  padding: 12px 16px;
  font-family: monospace;
  font-size: 14px;
  border: 1px solid #00ff00;
  border-radius: 4px;
  z-index: 999;
  line-height: 1.6;
`;
document.body.appendChild(cameraInfoDiv);

/* ======================
   LIGHTING
   FIRST PERSON CONTROLS
====================== */
// แสงทั่วฉาก
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const keys = { w: false, a: false, s: false, d: false };
const moveSpeed = 0.005;
const velocity = new THREE.Vector3();

// Mouse look
let isMouseDown = false;
const euler = new THREE.Euler(0, 0, 0, "YXZ");
const PI_2 = Math.PI / 2;
let lastX = 0;
let lastY = 0;

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "w") keys.w = true;
  if (e.key.toLowerCase() === "d") keys.a = true;
  if (e.key.toLowerCase() === "s") keys.s = true;
  if (e.key.toLowerCase() === "a") keys.d = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key.toLowerCase() === "w") keys.w = false;
  if (e.key.toLowerCase() === "a") keys.d = false;
  if (e.key.toLowerCase() === "s") keys.s = false;
  if (e.key.toLowerCase() === "d") keys.a = false;
});

renderer.domElement.addEventListener("mousedown", () => {
  isMouseDown = true;
});

document.addEventListener("mouseup", () => {
  isMouseDown = false;
});

document.addEventListener("mousemove", (e) => {
  if (!isMouseDown) {
    lastX = e.clientX;
    lastY = e.clientY;
    return;
  }
  
  const deltaX = e.clientX - lastX;
  const deltaY = e.clientY - lastY;
  
  lastX = e.clientX;
  lastY = e.clientY;
  
  euler.setFromQuaternion(camera.quaternion);
  // Euler doesn't have rotateX/rotateY methods in TypeScript; update components directly
  euler.y -= deltaX * 0.005;
  euler.x -= deltaY * 0.005;
  
  euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
  
  camera.quaternion.setFromEuler(euler);
});

function updateMovement() {
  const moveDir = new THREE.Vector3();
  
  // Get camera direction vectors
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  
  camera.getWorldDirection(forward);
  forward.y = 0; // Keep movement horizontal
  forward.normalize();
  
  right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
  
  // Apply keyboard input
  if (keys.w) moveDir.addScaledVector(forward, moveSpeed);
  if (keys.s) moveDir.addScaledVector(forward, -moveSpeed);
  if (keys.d) moveDir.addScaledVector(right, moveSpeed);
  if (keys.a) moveDir.addScaledVector(right, -moveSpeed);
  
  // Smooth movement with velocity
  velocity.lerp(moveDir, 0.2);
  camera.position.add(velocity);
}

// แสงเหมือนดวงอาทิตย์
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(200, 300, 100);
scene.add(sunLight);
/* ======================
   WINDOW RESIZE HANDLER
====================== */
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
});

/* ======================
   GRID (ช่วยอ้างอิงตำแหน่ง)
   LIGHT (ขั้นต่ำ)
====================== */
const grid = new THREE.GridHelper(1000, 50);
scene.add(grid);
scene.add(new THREE.AmbientLight(0xffffff, 1));

/* ======================
   LOAD CITY MODEL
   LOAD GLB
====================== */
const loader = new GLTFLoader();

loader.load(
  "/models/city.glb",
  (gltf: GLTF) => {
    const city = gltf.scene;

    // ปรับ scale ถ้าจำเป็น
    city.scale.set(1, 1, 1);
    city.position.set(0, 0, 0);

    // ตั้งค่า mesh ภายใน
    city.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    scene.add(city);
    console.log("City loaded ✅");
  },
  undefined,
  (error: unknown) => {
    console.error("Failed to load city.glb ❌", error);
  }
);

/* ======================
   RESIZE HANDLER
====================== */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ======================
   ANIMATION LOOP
   RENDER LOOP
====================== */
function animate() {
requestAnimationFrame(animate);
  controls.update();
  updateMovement();
  
  // Update camera info
  cameraInfoDiv.innerHTML = `
    <strong>Camera Position</strong><br>
    X: ${camera.position.x.toFixed(2)}<br>
    Y: ${camera.position.y.toFixed(2)}<br>
    Z: ${camera.position.z.toFixed(2)}<br>
    <br>
    <strong>Controls</strong><br>
    W/A/S/D: Walk<br>
    Mouse Drag: Look Around
  `;
  
renderer.render(scene, camera);
}

animate();