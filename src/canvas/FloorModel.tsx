import { useGLTF } from '@react-three/drei';

export default function FloorModel({ floor }: { floor: number }) {
  const { scene } = useGLTF(`/models/archif${floor}.glb`);
  return <primitive object={scene} scale={0.1} receiveShadow />;
}