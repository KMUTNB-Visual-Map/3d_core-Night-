import React from 'react';
import SearchBox from './SearchBox';
import FloorSelector from './FloorSelector';
import SetupModals from './SetupModals'; 
import { useNavStore } from '../store/useNavStore';

export default function OverlayUI() {
  const {
    isFollowing,
    toggleFollowing,
    cameraMode,
    cycleCameraMode,
    userPosition,
  } = useNavStore();

  const [userX, , userZ] = userPosition;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] p-6 flex flex-col justify-between">
      <SetupModals />

      <div className="absolute top-6 left-6 pointer-events-none">
        <div className="bg-black/90 px-3 py-2 rounded-xl text-xs text-white font-bold backdrop-blur-sm">
          <div>X: {userX.toFixed(2)}</div>
          <div>Z: {userZ.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex justify-center w-full pointer-events-auto">
        <SearchBox />
      </div>

      <div className="flex justify-between items-end w-full">
        {/* ปุ่ม GPS (ซ้ายล่าง) */}
        <button 
          onClick={() => toggleFollowing()}
          className={`px-5 py-3 rounded-xl shadow-2xl transition-all active:scale-95 pointer-events-auto flex items-center justify-center border-2 font-black text-sm ${
            isFollowing 
              ? 'bg-blue-600 border-blue-400 text-white animate-pulse' 
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <span className="mr-2 text-xl">{isFollowing ? '📡' : '📍'}</span>
          {isFollowing ? 'GPS: TRACKING' : 'GPS: OFF'}
        </button>

        {/* ปุ่ม Mode & Floor (ขวาล่าง) */}
        <div className="flex flex-row items-end gap-4">
          <div className="flex flex-col gap-2 items-center">
            <div className="bg-black/90 px-2 py-1 rounded text-[10px] text-white font-bold backdrop-blur-sm uppercase">
              {cameraMode}
            </div>
            <button 
              onClick={() => cycleCameraMode()}
              className="w-16 h-16 bg-white rounded-2xl border-2 border-slate-200 shadow-xl pointer-events-auto flex items-center justify-center text-3xl active:scale-90 transition-transform"
            >
              {cameraMode === 'FOLLOW' ? '🎥' : '📷'}
            </button>
          </div>
          <div className="pointer-events-auto">
            <FloorSelector />
          </div>
        </div>
      </div>
    </div>
  );
}