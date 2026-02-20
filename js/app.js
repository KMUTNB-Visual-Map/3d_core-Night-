// app.js
import { fetchLocations, sendNavigationGoal } from './api.js';

// =============================
// STATE
// =============================

let allLocations = [];
let currentFloor = null;

// =============================
// DOM ELEMENTS
// =============================

const searchInput = document.getElementById('search-input');
const resultsList = document.getElementById('results-list');
const filterButton = document.querySelector('.filter-button');
const floorButtons = document.querySelectorAll('.floor-btn');

// =============================
// INIT
// =============================

async function initApp() {
    console.log("📲 App Initializing...");
    allLocations = await fetchLocations();
    console.log(`✅ Loaded ${allLocations.length} locations.`);

    initFloorSelector();
}

// =============================
// SEARCH LOGIC
// =============================

searchInput.addEventListener('keyup', (e) => {
    const query = e.target.value.toLowerCase();
    resultsList.innerHTML = '';

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

function renderResults(items) {
    if (items.length > 0) {
        resultsList.style.display = 'block';

        items.forEach(loc => {
            const div = document.createElement('div');
            div.classList.add('result-item');
            div.innerHTML = `<strong>${loc.name_th}</strong> <small>${loc.name_en}</small>`;

            div.addEventListener('click', () => handleLocationSelect(loc));

            resultsList.appendChild(div);
        });

    } else {
        resultsList.style.display = 'block';
        resultsList.innerHTML = `<div class="result-item" style="color:#aaa;">ไม่พบข้อมูล</div>`;
    }
}

function handleLocationSelect(location) {
    searchInput.value = location.name_th;
    resultsList.style.display = 'none';
    searchInput.blur();

    sendNavigationGoal(location);
}

// =============================
// FLOOR SELECTOR LOGIC
// =============================

function initFloorSelector() {
    floorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedFloor = Number(btn.textContent);
            setFloor(selectedFloor);
        });
    });
}

function setFloor(floor) {
    const previousFloor = currentFloor;
    currentFloor = floor;

    floorButtons.forEach(btn => {
        const btnFloor = Number(btn.textContent);
        btn.classList.toggle('active', btnFloor === floor);
    });

    console.log(
        `🏢 Floor changed: ${previousFloor ?? 'None'} → ${floor}`
    );

    // ถ้ามี loadFloor(scene, floor)
    // loadFloor(scene, floor);
}
// =============================
// CLOSE DROPDOWN OUTSIDE CLICK
// =============================

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper') && !e.target.closest('.filter-button')) {
        resultsList.style.display = 'none';
    }
});

// =============================
// START
// =============================

initApp();