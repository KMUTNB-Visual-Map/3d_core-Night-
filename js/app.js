// app.js
import { fetchLocations, sendNavigationGoal } from './api.js';

// ตัวแปรเก็บข้อมูล
let allLocations = [];

// ตัวแปร DOM Elements
const searchInput = document.getElementById('search-input');
const resultsList = document.getElementById('results-list');
const filterButton = document.querySelector('.filter-button');

// 1. เริ่มทำงานเมื่อเปิดเว็บ (Initialize)
async function initApp() {
    console.log("📲 App Initializing...");
    allLocations = await fetchLocations();
    console.log(`✅ Loaded ${allLocations.length} locations.`);
}

// 2. ฟังก์ชันค้นหา (Logic การกรองข้อมูล)
searchInput.addEventListener('keyup', (e) => {
    const query = e.target.value.toLowerCase();
    resultsList.innerHTML = ''; // ล้างค่าเก่า

    if (query.length === 0) {
        resultsList.style.display = 'none';
        return;
    }

    const filtered = allLocations.filter(loc => {
        const th = loc.name_th ? loc.name_th.toLowerCase() : "";
        const en = loc.name_en ? loc.name_en.toLowerCase() : "";
        return th.includes(query) || en.includes(query);
    });

    renderResults(filtered);
});

// 3. ฟังก์ชันแสดงผล (Render UI)
function renderResults(items) {
    if (items.length > 0) {
        resultsList.style.display = 'block';
        items.forEach(loc => {
            const div = document.createElement('div');
            div.classList.add('result-item');
            div.innerHTML = `<strong>${loc.name_th}</strong> <small>${loc.name_en}</small>`;
            
            // เมื่อคลิกเลือก
            div.addEventListener('click', () => handleLocationSelect(loc));
            
            resultsList.appendChild(div);
        });
    } else {
        // กรณีไม่พบข้อมูล
        resultsList.style.display = 'block';
        resultsList.innerHTML = `<div class="result-item" style="color:#aaa;">ไม่พบข้อมูล</div>`;
    }
}

// 4. ฟังก์ชันเมื่อผู้ใช้เลือกสถานที่
function handleLocationSelect(location) {
    // Update UI
    searchInput.value = location.name_th;
    resultsList.style.display = 'none';
    searchInput.blur(); // ซ่อนคีย์บอร์ด

    // เรียกใช้ API เพื่อส่งข้อมูล
    sendNavigationGoal(location);
}

// 5. ปิด Dropdown เมื่อคลิกข้างนอก
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper') && !e.target.closest('.filter-button')) {
        resultsList.style.display = 'none';
    }
});

// เริ่มรันโปรแกรม
initApp();