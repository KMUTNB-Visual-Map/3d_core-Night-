type FreeOptions = {
  isActive: () => boolean;

  // Position
  getPosition: () => { x: number; z: number };
  setPosition: (x: number, z: number) => void;

  // Rotation
  addYaw: (delta: number) => void;
  addPitch: (delta: number) => void;

  moveSpeed: number;
  rotateSens: number;
};

export function bindFreeController(options: FreeOptions) {
  const keys: Record<string, boolean> = {};

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
     ROTATE (mouse left-right)
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
     TOUCH (1 finger pan / 2 finger rotate)
  ========================= */

  let lastTouches: { x: number; y: number }[] = [];

  window.addEventListener("touchstart", (e) => {
    if (!options.isActive()) return;

    lastTouches = [];

    for (let i = 0; i < e.touches.length; i++) {
      lastTouches.push({
        x: e.touches[i].clientX,
        y: e.touches[i].clientY,
      });
    }
  });

  window.addEventListener("touchmove", (e) => {
    if (!options.isActive()) return;

    // 1 finger = pan
    if (e.touches.length === 1 && lastTouches.length === 1) {
      const touch = e.touches[0];

      const dx = touch.clientX - lastTouches[0].x;
      const dy = touch.clientY - lastTouches[0].y;

      const pos = options.getPosition();

      const newX = pos.x - dx * options.moveSpeed;
      const newZ = pos.z - dy * options.moveSpeed;

      options.setPosition(newX, newZ);

      lastTouches[0] = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }

  // 2 fingers gesture
  if (e.touches.length === 2 && lastTouches.length === 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];

    const dy1 = t1.clientY - lastTouches[0].y;
    const dy2 = t2.clientY - lastTouches[1].y;

    // 👇 กรณีสวนทาง = rotate yaw
    if (dy1 * dy2 < 0) {
      const rotationAmount = (dy1 - dy2) * options.rotateSens;
      options.addYaw(rotationAmount);
    }

    // 👇 กรณีไปทิศเดียวกัน = pitch
    else if (dy1 * dy2 > 0) {
      const avgDy = (dy1 + dy2) / 2;
      options.addPitch(-avgDy * options.rotateSens);
    }

    lastTouches = [
      { x: t1.clientX, y: t1.clientY },
      { x: t2.clientX, y: t2.clientY },
    ];
  }
  });

  window.addEventListener("touchend", () => {
    lastTouches = [];
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