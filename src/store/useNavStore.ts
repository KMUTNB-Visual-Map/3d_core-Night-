import { create } from 'zustand';
import { PositioningManager } from '../core/positioning';

let positioning: PositioningManager | null = null;
let gpsOrigin: { x: number, y: number } | null = null;
let startDeadzoneUnlocked = false;

// 🟢 ค่าคงที่สำหรับแปลงพิกัด GPS เป็นเมตร
const METER_SCALE = 111319;
const START_DEADZONE_METERS = 1;

interface NavState {
  userId: string | null;

  // 🔹 UI floor
  currentFloor: number;

  // 🔹 Floor จริงจาก GPS
  userActualFloor: number | null;

  userPosition: [number, number, number];
  rawGpsPosition: [number, number] | null;
  convertedGpsMeters: [number, number] | null;
  targetLocation: any | null;

  cameraMode: 'FREE' | 'FOLLOW';
  isFollowing: boolean;

  setupStep: string | null;
  avatarType: 'female' | 'male' | null;

  initGuestId: () => void;
  setSetupStep: (step: string | null)=> void;
  setAvatarType: (type: 'female' | 'male' | null) => void;
  setFloor: (floor: number) => void;
  confirmUserFloor: (floor: number) => void;
  setTarget: (location: any | null) => void;
  toggleFollowing: () => void;
  cycleCameraMode: () => void;
  setUserActualFloor: (floor: number) => void;
  cancelSetup: () => void;
}

export const useNavStore = create<NavState>((set, get) => ({
  userId: null,

  currentFloor: 1,
  userActualFloor: null,

  userPosition: [0, 0, 0],
  rawGpsPosition: null,
  convertedGpsMeters: null,
  targetLocation: null,

  cameraMode: 'FREE',
  isFollowing: false,

  setupStep: 'avatar',
  avatarType: null,

  setUserActualFloor: (floor) => set({ userActualFloor: floor }),

  initGuestId: () => {
    let id = localStorage.getItem('guest_id');
    if (!id) {
      id = Math.random().toString(16).slice(2, 10);
      localStorage.setItem('guest_id', id);
    }

    if (!positioning) {
      positioning = new PositioningManager(id);
    }

    set({ userId: id });
  },

  setSetupStep: (step) => set({ setupStep: step }),

  setAvatarType: (type) =>
    set({
      avatarType: type,
      setupStep: 'floor',
    }),

  cancelSetup: () => set({ setupStep: 'none' }),

  setFloor: (floor) =>
    set({ currentFloor: floor }),

  confirmUserFloor: (floor) =>
    set({
      userActualFloor: floor,
      currentFloor: floor,
      setupStep: 'none',
    }),

  setTarget: (location) => {
    set({ targetLocation: location });

    if (location && positioning) {
      positioning.setDestination({
        x: location.node_id || 0,
        y: location.node_id || 0,
        floor_id: location.floor || 1,
      });
    }
  },

  cycleCameraMode: () => {
    const current = get().cameraMode;
    set({ cameraMode: current === 'FREE' ? 'FOLLOW' : 'FREE' });
  },

  toggleFollowing: () => {
    const newState = !get().isFollowing;

    if (newState) {
      gpsOrigin = null;
      startDeadzoneUnlocked = false;

      set({
        userPosition: [0, 0, 0],
        rawGpsPosition: null,
        convertedGpsMeters: null,
        isFollowing: true,
        cameraMode: 'FOLLOW',
      });

      if (!positioning) return;

      positioning.startGPSMode((pos: any) => {
        // 🔹 set origin ครั้งแรก
        if (!gpsOrigin) {
          gpsOrigin = { x: pos.x, y: pos.y };
        }

        // 🔹 แปลงเป็นเมตร
        const relativeX = (pos.x - gpsOrigin.x) * METER_SCALE;
        const relativeZ = (pos.y - gpsOrigin.y) * METER_SCALE;
        const distanceFromStart = Math.hypot(relativeX, relativeZ);

        if (!startDeadzoneUnlocked && distanceFromStart > START_DEADZONE_METERS) {
          startDeadzoneUnlocked = true;
        }

        const latRad = (pos.x * Math.PI) / 180;
        const convertedX = pos.y * METER_SCALE * Math.cos(latRad);
        const convertedZ = pos.x * METER_SCALE;

        console.log(
          `🚶 Walking: X=${relativeX.toFixed(2)}, Z=${relativeZ.toFixed(2)}`
        );

        // 🔥 อัปเดตตำแหน่ง + floor จริง
        set({
          userPosition: startDeadzoneUnlocked
            ? [relativeX, 0, relativeZ]
            : [0, 0, 0],
          rawGpsPosition: [pos.x, pos.y],
          convertedGpsMeters: [convertedX, convertedZ],
          userActualFloor: pos.floor_id ?? get().userActualFloor,
        });

        // ===============================
        // ✅ OPTIONAL: auto switch floor
        // ===============================
        /*
        if (pos.floor_id && pos.floor_id !== get().currentFloor) {
          set({ currentFloor: pos.floor_id });
        }
        */
      });
    } else {
      set({
        isFollowing: false,
        cameraMode: 'FREE',
        rawGpsPosition: null,
        convertedGpsMeters: null,
      });

      gpsOrigin = null;
      startDeadzoneUnlocked = false;

      if (positioning) {
        positioning.startManualMode();
      }
    }
  },
}));