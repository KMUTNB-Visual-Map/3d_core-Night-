type GestureOptions = {
  isActive: () => boolean;

  // Zoom
  getZoom: () => number;
  setZoom: (z: number) => void;
  zoomMin: number;
  zoomMax: number;
  zoomSpeed?: number; // optional sensitivity

  // Rotation
  addYaw: (delta: number) => void;
  panSens: number;
  deadzone?: number;
};

export function bindGesture(options: GestureOptions) {
  const zoomSpeed = options.zoomSpeed ?? 0.001;
  const deadzone = options.deadzone ?? 0;

  /* =========================
     MOBILE TOUCH SUPPORT
  ========================= */

  let isTouchPanning = false;
  let lastPanX = 0;
  let lastPinchDist: number | null = null;

  function pinchDistance(t: TouchList) {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.hypot(dx, dy);
  }

  window.addEventListener("touchstart", (e) => {
    if (!options.isActive()) return;

    if (e.touches.length === 1) {
      isTouchPanning = true;
      lastPanX = e.touches[0].clientX;
    }

    if (e.touches.length === 2) {
      isTouchPanning = false;
      lastPinchDist = pinchDistance(e.touches);
    }
  });

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!options.isActive()) return;

      e.preventDefault();

      // Pinch Zoom
      if (e.touches.length === 2 && lastPinchDist !== null) {
        const d = pinchDistance(e.touches);
        const delta = (d - lastPinchDist) * zoomSpeed;

        let newZoom = options.getZoom() + delta;

        newZoom = Math.max(options.zoomMin, newZoom);
        newZoom = Math.min(options.zoomMax, newZoom);

        options.setZoom(newZoom);
        lastPinchDist = d;
        return;
      }

      // Single finger rotate
      if (e.touches.length === 1 && isTouchPanning) {
        const dx = e.touches[0].clientX - lastPanX;
        lastPanX = e.touches[0].clientX;

        if (Math.abs(dx) > deadzone) {
          options.addYaw(-dx * options.panSens);
        }
      }
    },
    { passive: false }
  );

  window.addEventListener("touchend", () => {
    isTouchPanning = false;
    lastPinchDist = null;
  });

  /* =========================
     DESKTOP MOUSE SUPPORT
  ========================= */

  let isMouseDown = false;
  let lastMouseX = 0;

  // Rotate with drag
  window.addEventListener("mousedown", (e) => {
    if (!options.isActive()) return;
    isMouseDown = true;
    lastMouseX = e.clientX;
  });

  window.addEventListener("mousemove", (e) => {
    if (!options.isActive() || !isMouseDown) return;

    const dx = e.clientX - lastMouseX;
    lastMouseX = e.clientX;

    if (Math.abs(dx) > deadzone) {
      options.addYaw(-dx * options.panSens);
    }
  });

  window.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  window.addEventListener("mouseleave", () => {
    isMouseDown = false;
  });

  // Zoom with mouse wheel
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
      // optional cleanup if needed later
    },
  };
}
