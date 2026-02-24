import CONFIG_JSON from "../config/config.json";

export type CameraMode = "GESTURE" | "GYRO" | "FREE";

type UIOptions = {
  getMode: () => CameraMode;
  toggleMode: () => void;
  getDebugInfo: () => string;
  getPosition: () => { x: number; y: number; z: number };
  onRequestGPS: () => void;
  getGPSInfo: () => string;
  isFollowing: () => boolean;

  getYawDeg: () => number;      // ⭐ เพิ่ม
  getPitchDeg: () => number;    // ⭐ เพิ่ม
};

export function initUI(options: UIOptions) {
  const UI_ENABLED = CONFIG_JSON.ui?.enabled ?? true;
  const ALLOW_MODE_SWITCH =
    CONFIG_JSON.ui?.allowModeSwitch ?? true;

  /* =====================================================
     GPS BUTTON (แสดงตลอด)
  ===================================================== */

  const gpsBtn = document.createElement("button");

  Object.assign(gpsBtn.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "none",
    background: "#0055ff",
    color: "#fff",
    fontSize: "14px",
    zIndex: "9999",
  });

  gpsBtn.innerText = "📍 GPS";
  document.body.appendChild(gpsBtn);

  gpsBtn.onclick = () => {
    options.onRequestGPS();
  };

  /* =====================================================
     ถ้า UI ถูกปิด → ไม่สร้าง overlay + mode button
  ===================================================== */

  if (!UI_ENABLED) {
    return {
      update: () => {
        gpsBtn.style.background = options.isFollowing()
          ? "#0055ff"
          : "#ff4d4f";
      },
    };
  }

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
    padding: "10px 12px",
    borderRadius: "8px",
    fontFamily: "monospace",
    fontSize: "12px",
    pointerEvents: "none",
    zIndex: "9999",
    whiteSpace: "pre-line",
  });

  document.body.appendChild(overlay);

  /* =====================================================
     MODE BUTTON
  ===================================================== */

  let modeBtn: HTMLButtonElement | null = null;

  if (ALLOW_MODE_SWITCH) {
    modeBtn = document.createElement("button");

    Object.assign(modeBtn.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "10px 16px",
      borderRadius: "8px",
      border: "none",
      background: "#3fb44f",
      color: "#fff",
      fontSize: "14px",
      zIndex: "9999",
      boxShadow: "0 4px 12px rgb(51, 214, 119)",
    });

    document.body.appendChild(modeBtn);

    modeBtn.onclick = () => {
      options.toggleMode();
      update();
    };
  }

  /* =====================================================
     UPDATE
  ===================================================== */

function update() {
    const pos = options.getPosition();

    if (modeBtn) {
      modeBtn.innerText = `MODE: ${options.getMode()}`;
    }

    gpsBtn.style.background = options.isFollowing()
      ? "#0055ff"
      : "#ff4d4f";

    overlay.innerText = `
  YAW: ${options.getYawDeg().toFixed(1)}°
  PITCH: ${options.getPitchDeg().toFixed(1)}°
  ${options.getDebugInfo()}
  POSITION
  X: ${pos.x.toFixed(2)}
  Y: ${pos.y.toFixed(2)}
  Z: ${pos.z.toFixed(2)}
  GPS
  ${options.getGPSInfo()}
  `.trim();
  }

  update();

  return { update };
}