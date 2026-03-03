import React from 'react';
import { useNavStore } from '../store/useNavStore';

export default function SetupModals() {
  const { setupStep, setSetupStep, confirmUserFloor, setAvatarType, avatarType, cancelSetup } = useNavStore();

  // ป้องกันบั๊ก: ถ้า State ว่าง หรือเป็น none ให้ซ่อน Modal ไปเลย
  if (!setupStep || setupStep === 'none') return null;

  return (
    // ถอด animate-in ออกทั้งหมดเพื่อให้กล่องโชว์ชัวร์ๆ 100%
    <div className="fixed inset-0 bg-[#1A202C]/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 pointer-events-auto">
      
      {/* 🟢 STEP 1: Modal ถามชั้น (ตรงตามภาพเป๊ะ) */}
      {setupStep === 'floor' && (
        <div className="bg-white rounded-[32px] p-8 w-full max-w-[340px] shadow-2xl flex flex-col items-center">
          <h2 className="text-xl font-bold text-[#2A3547] mb-1">คุณอยู่ชั้นไหน?</h2>
          <p className="text-sm text-[#8A98A8] mb-6 text-center">เพื่อหาจุดเริ่มต้นการนำทาง (ตำแหน่งลิฟต์)</p>
          
          <div className="grid grid-cols-3 gap-3 w-full mb-8">
            {[1, 2, 3, 4, 5, 6].map(floor => (
              <button 
                key={floor}
                onClick={() => {
                  confirmUserFloor(floor);
                  // ✅ ถ้าเลือก avatar แล้ว ปิด modal เลย (มาจาก search box)
                  // ถ้ายังไม่เลือก avatar ให้ไปเลือก (initial setup)
                  setSetupStep(avatarType ? 'none' : 'avatar');
                }}
                className="py-3 px-2 bg-white border border-[#E2E8F0] rounded-2xl text-[#2A3547] font-bold hover:bg-slate-50 hover:border-[#CBD5E1] transition-all active:scale-95 shadow-sm"
              >
                ชั้น {floor}
              </button>
            ))}
          </div>

          <button onClick={cancelSetup} className="text-[#FF5252] font-bold hover:text-red-600 transition-colors">
            ยกเลิก
          </button>
        </div>
      )}

      {/* 🟢 STEP 2: Modal เลือกตัวละคร (ตรงตามภาพเป๊ะ) */}
      {setupStep === 'avatar' && (
        <div className="bg-white rounded-[32px] p-8 w-full max-w-[380px] shadow-2xl flex flex-col items-center">
          <h2 className="text-xl font-bold text-[#2A3547] mb-1">เลือกตัวละครของคุณ</h2>
          <p className="text-sm text-[#8A98A8] mb-6 text-center">เพื่อใช้ในการเดินนำทางบนแผนที่ 3D</p>
          
          <div className="flex gap-4 w-full mb-8 justify-center">
            
            {/* ปุ่มนักเรียนหญิง */}
            <button 
              onClick={() => {
                setAvatarType('female');
                setSetupStep('none'); // เลือกเสร็จ ปิด Pop-up
              }}
              className="flex-1 flex flex-col items-center p-4 py-6 bg-white border border-[#E2E8F0] rounded-[24px] hover:bg-slate-50 transition-all active:scale-95 shadow-sm group"
            >
              <div className="w-20 h-20 rounded-full bg-[#A8806B] mb-4 overflow-hidden border-2 border-transparent group-hover:border-[#8A6A58] flex items-center justify-center">
                <img src="/models/avartar_01.png" alt="นักเรียนหญิง" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-[#2A3547]">นักเรียนหญิง</span>
            </button>

            {/* ปุ่มนักเรียนชาย */}
            <button 
              onClick={() => {
                setAvatarType('male');
                setSetupStep('none'); // เลือกเสร็จ ปิด Pop-up
              }}
              className="flex-1 flex flex-col items-center p-4 py-6 bg-white border border-[#E2E8F0] rounded-[24px] hover:bg-slate-50 transition-all active:scale-95 shadow-sm group"
            >
              <div className="w-20 h-20 rounded-full bg-[#A8806B] mb-4 overflow-hidden border-2 border-transparent group-hover:border-[#8A6A58] flex items-center justify-center">
                <img src="/models/avartar_02.png" alt="นักเรียนชาย" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-[#2A3547]">นักเรียนชาย</span>
            </button>
            
          </div>

          <button onClick={cancelSetup} className="text-[#FF5252] font-bold hover:text-red-600 transition-colors">
            ยกเลิก
          </button>
        </div>
      )}
    </div>
  );
}