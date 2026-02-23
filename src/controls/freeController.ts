import * as THREE from "three";

type FreeOptions = {
  isActive: () => boolean;

  getPosition: () => { x: number; z: number };
  setPosition: (x: number, z: number) => void;

  addYaw: (delta: number) => void;
  addPitch: (delta: number) => void;

  moveSpeed: number;
  rotateSens: number;
};

export function bindFreeController(options: FreeOptions) {
  const keys: Record<string, boolean> = {};

  const MIN_HORIZONTAL_GAP = window.innerWidth * 0.4;
  const MIN_VERTICAL_MOVE = 2;

  let gestureMode: "none" | "single" | "multi" = "none";
  let lastTouches = new Map<number, { x: number; y: number }>();

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
    },
    { passive: false }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!options.isActive()) return;
      e.preventDefault();

      const touches = e.touches;

      /* ---------- SINGLE PAN ---------- */

      if (gestureMode === "single" && touches.length === 1) {
        const t = touches[0];
        const last = lastTouches.get(t.identifier);
        if (!last) return;

        const dx = t.clientX - last.x;
        const dy = t.clientY - last.y;

        const pos = options.getPosition();

        options.setPosition(
          pos.x - dx * options.moveSpeed,
          pos.z - dy * options.moveSpeed
        );

        lastTouches.set(t.identifier, {
          x: t.clientX,
          y: t.clientY,
        });
      }

      /* ---------- MULTI ROTATE / PITCH ---------- */

      if (gestureMode === "multi" && touches.length >= 2) {
        const t1 = touches[0];
        const t2 = touches[1];

        const last1 = lastTouches.get(t1.identifier);
        const last2 = lastTouches.get(t2.identifier);
        if (!last1 || !last2) return;

        const horizontalGap = Math.abs(t1.clientX - t2.clientX);
        if (horizontalGap < MIN_HORIZONTAL_GAP) return;

        const dy1 = t1.clientY - last1.y;
        const dy2 = t2.clientY - last2.y;

        if (
          Math.abs(dy1) < MIN_VERTICAL_MOVE &&
          Math.abs(dy2) < MIN_VERTICAL_MOVE
        )
          return;

        if (dy1 * dy2 < 0) {
          options.addYaw((dy1 - dy2) * options.rotateSens);
        } else if (dy1 * dy2 > 0) {
          const avg = (dy1 + dy2) / 2;
          options.addPitch(-avg * options.rotateSens);
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

  window.addEventListener("touchend", (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      lastTouches.delete(e.changedTouches[i].identifier);
    }

    if (e.touches.length === 0) {
      gestureMode = "none";
    }
  });

  /* =========================
     UPDATE LOOP
  ========================= */

  function update() {
    if (!options.isActive()) return;

    const pos = options.getPosition();
    let newX = pos.x;
    let newZ = pos.z;

    if (keys["w"]) newZ -= options.moveSpeed;
    if (keys["s"]) newZ += options.moveSpeed;
    if (keys["a"]) newX -= options.moveSpeed;
    if (keys["d"]) newX += options.moveSpeed;

    options.setPosition(newX, newZ);
  }

  return {
    update,
    dispose() {},
  };
}