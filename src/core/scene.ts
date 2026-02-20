import * as THREE from "three";

export function createScene() {
  const scene = new THREE.Scene();

  const container = document.getElementById("map");
  if (!container) {
    throw new Error("#map container not found");
  }

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.NoToneMapping;

  container.appendChild(renderer.domElement);

  // Light
  scene.add(new THREE.AmbientLight(0xffe0b2, 0.8));
  scene.background = new THREE.Color(0xaec6cf);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  return { scene, renderer };
}