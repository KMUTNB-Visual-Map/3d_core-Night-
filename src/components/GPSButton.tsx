import React from 'react';
import { useNavStore } from '../store/useNavStore';

export default function GPSButton() {
  const isFollowing = useNavStore((state) => state.isFollowing);
  const toggleFollowing = useNavStore((state) => state.toggleFollowing);

  return (
    <button
      onClick={() => {
        console.log("🛰️ GPS Clicked!");
        toggleFollowing();
      }}
      // วางซ้ายล่าง (left-6 bottom-6) และอยู่หน้าสุด (z-[9999])
      className={`fixed bottom-6 left-6 z-[9999] p-4 rounded-2xl shadow-2xl font-bold border-2 transition-all pointer-events-auto ${
        isFollowing 
          ? 'bg-blue-600 text-white border-blue-400 scale-105' 
          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${isFollowing ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
        {isFollowing ? 'GPS: TRACKING' : 'GPS: OFF'}
      </div>
    </button>
  );
}