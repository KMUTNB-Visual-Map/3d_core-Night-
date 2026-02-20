// api.js
import { CONFIG } from './config.js';

// ฟังก์ชันดึงข้อมูลสถานที่
export async function fetchLocations() {
    try {
        const response = await fetch(CONFIG.DATA_SOURCE_URL);
        if (!response.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return []; // ส่งอาเรย์ว่างกลับไปกันแอปพัง
    }
}

// ฟังก์ชันส่งข้อมูลเป้าหมายไปหา Backend
export async function sendNavigationGoal(location) {
    // สร้าง Payload ตามรูปแบบที่ตกลงกัน
    const payload = {
        "guest_id": CONFIG.CURRENT_USER_ID,
        "start_node": CONFIG.START_NODE_ID,
        "end_node": location.node_id,
        "mode": "gps",
        "location_name": `${location.name_th} (${location.name_en})`
    };

    // --- (ส่วนนี้คือจำลองการส่ง) ---
    console.log("📡 [API] Sending Data to Backend...");
    console.log(JSON.stringify(payload, null, 2));

    // --- (อนาคต: ถ้าจะส่งจริงให้เปิดใช้โค้ดด้านล่างนี้) ---
    /*
    const res = await fetch('URL_ของเพื่อน', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return await res.json();
    */

    return payload; // ส่งคืนค่าเพื่อเอาไปเช็ค
}