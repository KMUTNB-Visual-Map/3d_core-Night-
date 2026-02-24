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

  getHeight: () => number;
  setHeight: (h: number) => void;

  moveSpeed: number;

  yawSens: number;      // 🔥 แยกแล้ว
  pitchSens: number;    // 🔥 แยกแล้ว
  zoomSens: number;
};

const MIN_PITCH = THREE.MathUtils.degToRad(
  CONFIG_JSON.camera?.pitchMinDeg ?? 30
);

const MAX_PITCH = THREE.MathUtils.degToRad(
  CONFIG_JSON.camera?.pitchMaxDeg ?? 60
);

const MIN_HEIGHT = CONFIG_JSON.camera?.minHeight ?? 5;
const MAX_HEIGHT = CONFIG_JSON.camera?.maxHeight ?? 200;

const SMOOTHING = 0.12; // 0.1–0.15 ดีสุด

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function bindFreeController(options: FreeOptions) {

  let gestureMode: "none" | "single" | "multi" = "none";
  let multiMode: "none" | "rotate" | "pinch" = "none";

  let lastTouches = new Map<number, { x: number; y: number }>();
  let lastPinchDistance = 0;

  /* ---------- smooth velocities ---------- */
  let yawVelocity = 0;
  let pitchVelocity = 0;
  let heightVelocity = 0;

  /* =========================
     TOUCH START
  ========================= */

  window.addEventListener("touchstart", (e) => {
    if (!options.isActive()) return;

    gestureMode =
      e.touches.length === 1
        ? "single"
        : e.touches.length >= 2
        ? "multi"
        : "none";

    multiMode = "none";
    lastTouches.clear();

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
  }, { passive: false });

  /* =========================
     TOUCH MOVE
  ========================= */

  window.addEventListener("touchmove", (e) => {
    if (!options.isActive()) return;
    e.preventDefault();

    const touches = e.touches;

    /* ---------- SINGLE MOVE (WASD style move) ---------- */
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
        pos.x + forwardX * moveForward + rightX * moveRight,
        pos.z + forwardZ * moveForward + rightZ * moveRight
      );

      lastTouches.set(t.identifier, {
        x: t.clientX,
        y: t.clientY,
      });
    }

    /* ---------- MULTI ---------- */
    if (gestureMode === "multi" && touches.length >= 2) {
      const t1 = touches[0];
      const t2 = touches[1];

      const last1 = lastTouches.get(t1.identifier);
      const last2 = lastTouches.get(t2.identifier);
      if (!last1 || !last2) return;

      const dx1 = t1.clientX - last1.x;
      const dy1 = t1.clientY - last1.y;
      const dx2 = t2.clientX - last2.x;
      const dy2 = t2.clientY - last2.y;

      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (multiMode === "none") {
        if (dx1 * dx2 < 0 || dy1 * dy2 < 0) {
          multiMode = "pinch";
        } else {
          multiMode = "rotate";
        }
      }

      /* ----- ROTATE ----- */
      if (multiMode === "rotate") {
        const avgX = (dx1 + dx2) / 2;
        const avgY = (dy1 + dy2) / 2;

        yawVelocity   += -avgX * options.yawSens;
        pitchVelocity += -avgY * options.pitchSens;
      }

      /* ----- PINCH (HEIGHT) ----- */
      if (multiMode === "pinch") {
        const deltaDistance = distance - lastPinchDistance;
        heightVelocity += -deltaDistance * options.zoomSens;
        lastPinchDistance = distance;
      }

      lastTouches.set(t1.identifier, { x: t1.clientX, y: t1.clientY });
      lastTouches.set(t2.identifier, { x: t2.clientX, y: t2.clientY });
    }

  }, { passive: false });

  window.addEventListener("touchend", () => {
    gestureMode = "none";
    multiMode = "none";
    lastTouches.clear();
  });

  /* =========================
     UPDATE LOOP
  ========================= */

  function update() {
    if (!options.isActive()) return;

    /* ---- YAW ---- */
    if (Math.abs(yawVelocity) > 0.00001) {
      options.addYaw(yawVelocity);
      yawVelocity *= (1 - SMOOTHING);
    }

    /* ---- PITCH ---- */
    if (Math.abs(pitchVelocity) > 0.00001) {
      const currentPitch = options.getPitch();
      const nextPitch = clamp(
        currentPitch + pitchVelocity,
        MIN_PITCH,
        MAX_PITCH
      );

      options.addPitch(nextPitch - currentPitch);
      pitchVelocity *= (1 - SMOOTHING);
    }

    /* ---- HEIGHT ---- */
    if (Math.abs(heightVelocity) > 0.00001) {
      const currentHeight = options.getHeight();
      const nextHeight = clamp(
        currentHeight + heightVelocity,
        MIN_HEIGHT,
        MAX_HEIGHT
      );

      options.setHeight(nextHeight);
      heightVelocity *= (1 - SMOOTHING);
    }
  }

  return { update, dispose() {} };
}