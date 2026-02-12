export type CameraMode = "GYRO" | "GESTURE";

type UIOptions = {
  getMode: () => CameraMode;
  toggleMode: () => void;
  getDebugInfo: () => string;
};

export function initUI(options: UIOptions) {
  /* =====================================================
     DEBUG OVERLAY
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
     MODE BUTTON
  ===================================================== */

  const modeBtn = document.createElement("button");

  Object.assign(modeBtn.style, {
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

  document.body.appendChild(modeBtn);

  /* =====================================================
     UPDATE FUNCTION
  ===================================================== */

  function update() {
    modeBtn.innerText = `MODE: ${options.getMode()}`;
    overlay.innerText = options.getDebugInfo();
  }

  modeBtn.onclick = () => {
    options.toggleMode();
    update();
  };

  // initialize UI once
  update();

  return {
    update,
  };
}
