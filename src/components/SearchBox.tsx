import { useState, useMemo } from 'react';
import { useNavStore } from '../store/useNavStore';


type Location = {
  location_id: number;
  node_id: number;
  name_th: string;
  name_en: string;
  category: string;
  floor: number;
};

const LOCATIONS_DATA: Location[] = [
  { "location_id": 1, "node_id": 101, "name_th": "โถงใต้อาคาร 81 (ลานอเนกประสงค์)", "name_en": "Under Bldg 81 (Hall)", "category": "public", "floor": 1 },
  { "location_id": 2, "node_id": 205, "name_th": "ภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์ (ECE)", "name_en": "Dept. of ECE", "category": "department", "floor": 2 },
  { "location_id": 3, "node_id": 100, "name_th": "ลิฟต์ ชั้น 1", "name_en": "Elevator Fl.1", "category": "transport", "floor": 1 },
  { "location_id": 4, "node_id": 200, "name_th": "ลิฟต์ ชั้น 2", "name_en": "Elevator Fl.2", "category": "transport", "floor": 2 },
  { "location_id": 5, "node_id": 300, "name_th": "ลิฟต์ ชั้น 3", "name_en": "Elevator Fl.3", "category": "transport", "floor": 3 },
  { "location_id": 6, "node_id": 400, "name_th": "ลิฟต์ ชั้น 4", "name_en": "Elevator Fl.4", "category": "transport", "floor": 4 },
  { "location_id": 7, "node_id": 500, "name_th": "ลิฟต์ ชั้น 5", "name_en": "Elevator Fl.5", "category": "transport", "floor": 5 },
  { "location_id": 8, "node_id": 600, "name_th": "ลิฟต์ ชั้น 6", "name_en": "Elevator Fl.6", "category": "transport", "floor": 6 },
  { "location_id": 9, "node_id": 212, "name_th": "ห้องพักอาจารย์ (ชั้น 2)", "name_en": "Teacher Room (Fl.2)", "category": "office", "floor": 2 },
  { "location_id": 10, "node_id": 315, "name_th": "ห้องเรียน 81-315", "name_en": "Room 81-315", "category": "academic", "floor": 3 },
  { "location_id": 11, "node_id": 412, "name_th": "ห้องปฏิบัติการคอมพิวเตอร์ (ชั้น 4)", "name_en": "Computer Lab (Fl.4)", "category": "academic", "floor": 4 },
  { "location_id": 12, "node_id": 513, "name_th": "ห้องเรียน 81-513", "name_en": "Room 81-513", "category": "academic", "floor": 5 },
  { "location_id": 13, "node_id": 601, "name_th": "ห้องประชุมใหญ่ (ชั้น 6)", "name_en": "Conference Room (Fl.6)", "category": "academic", "floor": 6 },
  { "location_id": 14, "node_id": 602, "name_th": "ห้องเรียน 81-603", "name_en": "Room 81-603", "category": "academic", "floor": 6 }
];

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { setTarget, setSetupStep } = useNavStore();

  const suggestions = useMemo<Location[]>(() => {
    if (!query.trim()) return LOCATIONS_DATA.slice(0, 5);
    return LOCATIONS_DATA.filter(loc => 
      loc.name_th.toLowerCase().includes(query.toLowerCase()) ||
      loc.name_en.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); 
  }, [query]);

  const handleSelect = (loc: Location) => {
    setQuery(''); 
    setIsFocused(false);
    setTarget(loc); // 1. ✅ ตั้งเป้าหมายใน Store ตามที่เลือกจาก SearchBox
    setSetupStep('floor'); // 2. ✅ เปิดหน้าถามชั้นจริงที่ผู้ใช้ยืนอยู่
  };

  return (
    <div className="relative w-full max-w-md pointer-events-auto">
      <input
        type="text"
        value={query}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหาห้องหรือสถานที่..."
        className="w-full px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-white/20 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 transition-all"
      />

      {(isFocused || query.length > 0) && suggestions.length > 0 && (
        <div className="absolute w-full mt-2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-[100] max-h-[300px] overflow-y-auto">
          {suggestions.map((loc) => {
            return (
              <div
                key={loc.location_id}
                onClick={() => handleSelect(loc)}
                className="px-5 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-none transition-colors"
              >
                <div className="text-sm font-bold text-slate-800">{loc.name_th}</div>
                <div className="text-[10px] text-blue-500 font-semibold uppercase tracking-tight">
                  ชั้น {loc.floor}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}