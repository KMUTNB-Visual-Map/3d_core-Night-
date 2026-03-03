import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import MapCanvas from './canvas/MapCanvas'; 
import OverlayUI from './components/OverlayUI';
import { useNavStore } from './store/useNavStore';

function App() {
  const initGuestId = useNavStore((state) => state.initGuestId);

  useEffect(() => {
    if (typeof initGuestId === 'function') {
      initGuestId();
    }
  }, [initGuestId]);

  return (
    <div className="w-screen h-screen relative bg-slate-900 overflow-hidden">
      {/* ส่วนของแผนที่ 3D */}
      <Canvas shadows>
        <MapCanvas />
      </Canvas>
      
      {/* 🟢 ส่วน UI หลัก (มีปุ่ม GPS และ Mode อยู่ข้างในแล้ว) */}
      <OverlayUI />
    </div>
  );
}

export default App;