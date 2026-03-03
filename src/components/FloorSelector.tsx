import React from 'react';
import { useNavStore } from '../store/useNavStore';

export default function FloorSelector() {
  const { 
    currentFloor, 
    setFloor,
    userId, // ✅ เปลี่ยนจาก guestId เป็น userId ให้ตรงกับ Store ตัวล่าสุด
    userPosition, 
    targetLocation 
  } = useNavStore();
  
  const floors = [6, 5, 4, 3, 2, 1];

  return (
    <div className="flex flex-col gap-3 pointer-events-auto">
      {floors.map((f) => {
        const isActive = currentFloor === f;
        return (
          <button 
            key={f} 
            onClick={() => {
              // --- 📊 ส่วนของ Log สำหรับเช็คการทำงาน ---
              console.log("------- Floor Change Check -------");
              console.log("Floor Selected:", f);
              console.log("User ID (Guest):", userId); // ✅ จะไม่ undefined แล้ว
              console.log("Current User Position (3D):", userPosition);
              
              // ตรวจสอบพิกัดเป้าหมายที่เลือกจาก SearchBox
              if (targetLocation) {
                console.log("Target Destination:", {
                  id: targetLocation.location_id,
                  node: targetLocation.node_id,
                  name: targetLocation.name_th,
                  floor: targetLocation.floor
                });
              } else {
                console.log("Target Destination: null (ยังไม่ได้เลือกสถานที่)");
              }
              console.log("----------------------------------");
              
              // เปลี่ยนชั้นที่กำลังดู (ไม่กระทบชั้นจริง)
              setFloor(f);
            }}
            className={`w-14 h-14 rounded-2xl shadow-xl font-black transition-all flex items-center justify-center border-2 ${
              isActive 
                ? '!bg-blue-600 text-white border-blue-400 scale-110 shadow-blue-500/50' 
                : 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="text-2xl relative z-10">{f}</span>
          </button>
        );
      })}
    </div>
  );
}