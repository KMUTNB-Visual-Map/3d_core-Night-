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
          key="free-mode"
          domElement={gl.domElement}
          makeDefault
          enableDamping
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
