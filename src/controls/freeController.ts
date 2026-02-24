import * as THREE from "three";
import CONFIG_JSON from "../config/config.json";

type FreeOptions = {
  isActive: () => boolean;

  getPosition: () => { x: number; z: number };
  setPosition: (x: number, z: number) => void;

  getYaw: () => number;
  getPitch: () => number;

  addYaw: (delta: number) => void;
  addPitch: (delta: number) => void;

  getHeight: () => number;      // ⭐ เพิ่ม
  setHeight: (h: number) => void; // ⭐ เพิ่ม

  moveSpeed: number;
  rotateSens: number;
  zoomSens: number;             // ⭐ sensitivity pinch
};

/* =========================
   PITCH LIMIT FROM CONFIG
========================= */

const MIN_PITCH = THREE.MathUtils.degToRad(
  CONFIG_JSON.camera?.pitchMinDeg ?? 30
);

const MAX_PITCH = THREE.MathUtils.degToRad(
  CONFIG_JSON.camera?.pitchMaxDeg ?? 60
);

const MIN_HEIGHT = CONFIG_JSON.camera?.minHeight ?? 5;
const MAX_HEIGHT = CONFIG_JSON.camera?.maxHeight ?? 200;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function bindFreeController(options: FreeOptions) {
  const keys: Record<string, boolean> = {};

  const MIN_HORIZONTAL_GAP = window.innerWidth * 0.4;
  const MIN_VERTICAL_MOVE = 2;

  let gestureMode: "none" | "single" | "multi" = "none";
  let lastTouches = new Map<number, { x: number; y: number }>();
  let lastPinchDistance = 0;

  /* =========================
     KEYBOARD (WASD)
  ========================= */

  window.addEventListener("keydown", (e) => {
    if (!options.isActive()) return;
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  /* =========================
     MOUSE ROTATE
  ========================= */

  let isMouseDown = false;
  let lastX = 0;

  window.addEventListener("mousedown", (e) => {
    if (!options.isActive()) return;
    isMouseDown = true;
    lastX = e.clientX;
  });

  window.addEventListener("mousemove", (e) => {
    if (!options.isActive() || !isMouseDown) return;

    const dx = e.clientX - lastX;
    lastX = e.clientX;

    options.addYaw(-dx * options.rotateSens);
  });

  window.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  /* =========================
     TOUCH
  ========================= */

  window.addEventListener(
    "touchstart",
    (e) => {
      if (!options.isActive()) return;

      if (e.touches.length === 1) gestureMode = "single";
      if (e.touches.length >= 2) gestureMode = "multi";

      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        lastTouches.set(t.identifier, {
          x: t.clientX,
          y: t.clientY,
        });
      }

      if (e.touches.length >= 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    },
    { passive: false }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!options.isActive()) return;
      e.preventDefault();

      const touches = e.touches;

      /* ---------- SINGLE MOVE ---------- */

      if (gestureMode === "single" && touches.length === 1) {
        const t = touches[0];
        const last = lastTouches.get(t.identifier);
        if (!last) return;

        const dx = t.clientX - last.x;
        const dy = t.clientY - last.y;

        const pos = options.getPosition();
        const yaw = options.getYaw();

        const forwardX = Math.sin(yaw);
        const forwardZ = Math.cos(yaw);

        const rightX = Math.cos(yaw);
        const rightZ = -Math.sin(yaw);

        const moveForward = -dy * options.moveSpeed;
        const moveRight = -dx * options.moveSpeed;

        options.setPosition(
          pos.x +
            forwardX * moveForward +
            rightX * moveRight,
          pos.z +
            forwardZ * moveForward +
            rightZ * moveRight
        );

        lastTouches.set(t.identifier, {
          x: t.clientX,
          y: t.clientY,
        });
      }

      /* ---------- MULTI TOUCH ---------- */

      if (gestureMode === "multi" && touches.length >= 2) {
        const t1 = touches[0];
        const t2 = touches[1];

        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        /* 🔥 PINCH → HEIGHT */
        const deltaDistance = distance - lastPinchDistance;

        if (Math.abs(deltaDistance) > 2) {
          const currentHeight = options.getHeight();
          const nextHeight = clamp(
            currentHeight - deltaDistance * options.zoomSens,
            MIN_HEIGHT,
            MAX_HEIGHT
          );
          options.setHeight(nextHeight);
        }

        lastPinchDistance = distance;

        /* 🔥 TWO FINGER SWIPE → PITCH */

        const last1 = lastTouches.get(t1.identifier);
        const last2 = lastTouches.get(t2.identifier);
        if (!last1 || !last2) return;

        const dy1 = t1.clientY - last1.y;
        const dy2 = t2.clientY - last2.y;

        if (dy1 * dy2 > 0) {
          const avg = (dy1 + dy2) / 2;
          const delta = -avg * options.rotateSens;

          const currentPitch = options.getPitch();
          const nextPitch = clamp(
            currentPitch + delta,
            MIN_PITCH,
            MAX_PITCH
          );

          options.addPitch(nextPitch - currentPitch);
        }

        lastTouches.set(t1.identifier, {
          x: t1.clientX,
          y: t1.clientY,
        });

        lastTouches.set(t2.identifier, {
          x: t2.clientX,
          y: t2.clientY,
        });
      }
    },
    { passive: false }
  );

  window.addEventListener("touchend", () => {
    lastPinchDistance = 0;
    gestureMode = "none";
  });

  /* =========================
     UPDATE LOOP
  ========================= */

  function update() {
    if (!options.isActive()) return;

    const pos = options.getPosition();
    const yaw = options.getYaw();

    let moveForward = 0;
    let moveRight = 0;

    if (keys["w"]) moveForward += options.moveSpeed;
    if (keys["s"]) moveForward -= options.moveSpeed;
    if (keys["a"]) moveRight -= options.moveSpeed;
    if (keys["d"]) moveRight += options.moveSpeed;

    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);

    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    options.setPosition(
      pos.x +
        forwardX * moveForward +
        rightX * moveRight,
      pos.z +
        forwardZ * moveForward +
        rightZ * moveRight
    );
  }

  return { update, dispose() {} };
}