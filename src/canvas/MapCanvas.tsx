import { Suspense, useEffect, useRef } from 'react';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useNavStore } from '../store/useNavStore';
import FloorModel from './FloorModel';
import Avatar from './Avatar.jsx';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export default function MapCanvas() {
  const {
    currentFloor,
    userActualFloor,
    cameraMode,
    userPosition,
    avatarType,
    targetLocation,
  } = useNavStore();

  const { gl } = useThree();

  // Controls ref to dynamically toggle pan/zoom based on gesture classification
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // -----------------------------
  // Avatar Render Condition
  // -----------------------------
  const selectedFloor = userActualFloor ?? targetLocation?.floor ?? null;

  const shouldRenderAvatar =
    selectedFloor !== null &&
    currentFloor === selectedFloor &&
    avatarType !== null;

  // -----------------------------
  // Gyro State
  // -----------------------------
  const gyro = useRef<{
    alpha: number;
    initial: number | null;
  }>({
    alpha: 0,
    initial: null,
  });

  // -----------------------------
  // Device Orientation Listener
  // -----------------------------
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (cameraMode === 'FOLLOW' && e.alpha !== null) {
        if (gyro.current.initial === null) {
          gyro.current.initial = e.alpha;
        }

        const diff = e.alpha - gyro.current.initial;
        gyro.current.alpha = THREE.MathUtils.degToRad(diff);
      }
    };

    if (cameraMode === 'FOLLOW') {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      gyro.current.initial = null;
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [cameraMode]);

  // -----------------------------
  // Touch Gesture Lock (mutually exclusive pan vs zoom)
  // -----------------------------
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    const state = {
      initialDistance: 0,
      lastMid: { x: 0, y: 0 },
      mode: 'idle' as 'idle' | 'pending' | 'pan' | 'zoom',
    };

    const resetControls = () => {
      state.mode = 'idle';
      controlsRef.current && (controlsRef.current.enablePan = true);
      controlsRef.current && (controlsRef.current.enableZoom = true);
    };

    const calcDistance = () => {
      const pts = Array.from(pointers.values());
      if (pts.length < 2) return 0;
      const [a, b] = pts;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.hypot(dx, dy);
    };

    const calcMid = () => {
      const pts = Array.from(pointers.values());
      if (pts.length < 2) return { x: 0, y: 0 };
      const [a, b] = pts;
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        state.initialDistance = calcDistance();
        state.lastMid = calcMid();
        state.mode = 'pending';
        controlsRef.current && (controlsRef.current.enablePan = true);
        controlsRef.current && (controlsRef.current.enableZoom = true);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const distance = calcDistance();
        const mid = calcMid();
        const distDelta = distance - state.initialDistance;
        const midMove = Math.hypot(mid.x - state.lastMid.x, mid.y - state.lastMid.y);

        // Decide gesture once when pending: zoom dominates distance change, pan dominates translation
        if (state.mode === 'pending') {
          const pinchThreshold = 8;      // how much distance must change to count as pinch
          const panThreshold = 4;        // how much mid-point movement counts as pan
          const pinchNoiseGuard = 10;    // small distance change that we still treat as pan noise

          const distAbs = Math.abs(distDelta);
          const pinchDominates = distAbs > pinchThreshold && distAbs > midMove * 1.3;

          if (pinchDominates) {
            state.mode = 'zoom';
            controlsRef.current && (controlsRef.current.enableZoom = true);
            controlsRef.current && (controlsRef.current.enablePan = false);
          } else if (
            midMove > panThreshold ||
            (midMove > 0 && distAbs <= pinchNoiseGuard)
          ) {
            // Allow small pinch drift to still register as pan
            state.mode = 'pan';
            controlsRef.current && (controlsRef.current.enablePan = true);
            controlsRef.current && (controlsRef.current.enableZoom = false);
          }
        }

        // Maintain locks during gesture
        if (state.mode === 'zoom') {
          controlsRef.current && (controlsRef.current.enableZoom = true);
          controlsRef.current && (controlsRef.current.enablePan = false);
        } else if (state.mode === 'pan') {
          controlsRef.current && (controlsRef.current.enablePan = true);
          controlsRef.current && (controlsRef.current.enableZoom = false);
        }

        state.lastMid = mid;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) {
        resetControls();
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      resetControls();
    };
  }, [gl.domElement]);

  // -----------------------------
  // Camera Follow Logic
  // -----------------------------
  useFrame((state) => {
    if (cameraMode !== 'FOLLOW') return;
    if (!shouldRenderAvatar) return;

    const radius = 3.2;
    const targetY = 1.3;
    const smoothing = 0.1;

    const targetX =
      userPosition[0] - Math.sin(gyro.current.alpha) * radius;

    const targetZ =
      userPosition[2] - Math.cos(gyro.current.alpha) * radius;

    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      targetX,
      smoothing
    );

    state.camera.position.z = THREE.MathUtils.lerp(
      state.camera.position.z,
      targetZ,
      smoothing
    );

    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      targetY,
      smoothing
    );
    console.log("currentFloor:", currentFloor);
    console.log("userActualFloor:", userActualFloor);

    state.camera.lookAt(userPosition[0], 1.2, userPosition[2]);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1.5} />
      <Environment preset="city" />

      {/* Default Camera */}
      <PerspectiveCamera
        makeDefault
        position={[15, 15, 15]}
        fov={45}
      />

      {/* Free Mode Controls */}
      {cameraMode === 'FREE' && (
        <OrbitControls
          ref={controlsRef}
          key="free-mode"
          domElement={gl.domElement}
          makeDefault
          enableDamping
          // Gestures: 1-finger rotate, 2-finger drag pan, 2-finger pinch zoom
          enablePan
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
          target={[userPosition[0], 1, userPosition[2]]}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={0}
        />
      )}

      <Suspense fallback={null}>
        {/* Floor Model (ยกเล็กน้อยตามที่กำหนด) */}
        <group position={[0, -0.08, 0]}>
          <FloorModel floor={currentFloor} />
        </group>

        {/* Avatar render เฉพาะตอน floor ตรงกัน */}
        {shouldRenderAvatar && <Avatar />}
      </Suspense>

      {/* Shadow */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.4}
        scale={30}
        blur={2}
      />
    </>
  );
}
