type FreeOptions = {
  isActive: () => boolean;

  // Position
  getPosition: () => { x: number; z: number };
  setPosition: (x: number, z: number) => void;

  // Rotation
  addYaw: (delta: number) => void;

  // Zoom
  getZoom: () => number;
  setZoom: (z: number) => void;
  zoomMin: number;
  zoomMax: number;
  zoomSpeed?: number;

  panSpeed: number;
  rotateSens: number;
  deadzone?: number;
};

export function bindFreeController(options: FreeOptions) {
  const zoomSpeed = options.zoomSpeed ?? 0.001;
  const deadzone = options.deadzone ?? 0;

  let isMouseDown = false;
  let lastX = 0;
  let lastY = 0;

  /* =========================
     DESKTOP
  ========================= */

  window.addEventListener("mousedown", (e) => {
    if (!options.isActive()) return;

    isMouseDown = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!options.isActive() || !isMouseDown) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    lastX = e.clientX;
    lastY = e.clientY;

    if (Math.abs(dx) < deadzone && Math.abs(dy) < deadzone) return;

    // Left-right drag = rotate
    options.addYaw(-dx * options.rotateSens);

    // Up-down drag = pan forward/back
    const pos = options.getPosition();
    const newX = pos.x - dy * options.panSpeed;
    const newZ = pos.z - dx * options.panSpeed;

    options.setPosition(newX, newZ);
  });

  window.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  window.addEventListener("mouseleave", () => {
    isMouseDown = false;
  });

  /* =========================
     ZOOM
  ========================= */

  window.addEventListener(
    "wheel",
    (e) => {
      if (!options.isActive()) return;

      const delta = -e.deltaY * zoomSpeed;
      let newZoom = options.getZoom() + delta;

      newZoom = Math.max(options.zoomMin, newZoom);
      newZoom = Math.min(options.zoomMax, newZoom);

      options.setZoom(newZoom);
    },
    { passive: true }
  );

  return {
    dispose() {
      // optional future cleanup
    },
  };
}