// ══ CALENDAR ═════════════════════════════════════════════
let calDate = new Date();
const M_TH  = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
let selDate = null;
let fullyBookedDates = new Set();

async function loadFullyBookedDates() {
    try {
        const res  = await fetch('/User/GetFullyBookedDates');
        const data = await res.json();
        fullyBookedDates = new Set(data);
        renderCal();
    } catch(e) {}
}

function renderCal() {
    const today = new Date(); today.setHours(0,0,0,0);
    const max   = new Date(today); max.setDate(today.getDate() + 7);

    document.getElementById('calMonth').textContent =
        M_TH[calDate.getMonth()] + ' ' + (calDate.getFullYear() + 543);

    const first = new Date(calDate.getFullYear(), calDate.getMonth(), 1);
    const last  = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0);

    let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;">';
    ['อา','จ','อ','พ','พฤ','ศ','ส'].forEach(d =>
        html += `<div style="font-size:.65rem;color:var(--ns-ink3);padding:2px;">${d}</div>`);

    for (let i = 0; i < first.getDay(); i++) html += '<div></div>';
    for (let d = 1; d <= last.getDate(); d++) {
        const dt = new Date(calDate.getFullYear(), calDate.getMonth(), d);
        dt.setHours(0,0,0,0);
        const iso    = dt.toISOString().split('T')[0];
        const inRange = dt >= today && dt <= max;
        const isFull  = fullyBookedDates.has(iso);
        const ok      = inRange && !isFull;
        const act     = selDate === iso;

        let bg    = act ? 'var(--ns-ink)' : 'transparent';
        let color = act ? 'var(--ns-bg)'  : ok ? 'var(--ns-ink)' : 'var(--ns-bg3)';
        let extra = '';

        if (isFull && inRange) {
            bg    = 'rgba(220,53,69,.12)';
            color = 'rgba(220,53,69,.7)';
            extra = 'text-decoration:line-through;';
        }

        html += `<div onclick="${ok ? `pickDate('${iso}')` : ''}"
            title="${isFull && inRange ? 'ห้องเต็มทุกห้อง' : ''}"
            style="padding:6px 2px;border-radius:3px;cursor:${ok?'pointer':'default'};
            font-size:.82rem;font-family:'Kanit',sans-serif;font-weight:${act?700:500};
            background:${bg};color:${color};${extra}transition:background .15s;">${d}</div>`;
    }
    html += '</div>';
    document.getElementById('calGrid').innerHTML = html;
}

function pickDate(iso) {
    selDate = iso;
    document.getElementById('inputDate').value = iso;
    renderCal();
    const d = new Date(iso);
    document.getElementById('sv1').textContent =
        d.getDate() + ' ' + M_TH[d.getMonth()] + ' ' + (d.getFullYear() + 543);
    document.getElementById('confirmStep1').disabled = false;
}

function prevMonth() { calDate.setMonth(calDate.getMonth()-1); renderCal(); }
function nextMonth() { calDate.setMonth(calDate.getMonth()+1); renderCal(); }

// ══ STEPS ════════════════════════════════════════════════
function toggleStep(n) {
    const el = document.getElementById('step' + n);
    if (el.classList.contains('locked')) return;
    el.classList.toggle('active');
}

function confirmStep(n) {
    document.getElementById('step' + n).classList.remove('active');
    const next = document.getElementById('step' + (n + 1));
    if (!next) return;
    next.classList.remove('locked');
    next.classList.add('active');
    if (n === 3) renderTimeline();
}

// ══ PEOPLE ═══════════════════════════════════════════════
function updatePeopleStep(val) {
    const n = parseInt(val) || 1;
    let anyVisible = false;

    document.querySelectorAll('[data-room-size]').forEach(col => {
        const size = parseInt(col.dataset.roomSize);
        const show = size >= n;
        col.style.display = show ? '' : 'none';

        const radio = col.querySelector('input[name="RoomId"]');
        if (radio && !show && radio.checked) {
            radio.checked = false;
            document.getElementById('sv3').textContent = 'เลือกห้องที่ต้องการ';
            document.getElementById('confirmStep3').disabled = true;
        }
        if (show) anyVisible = true;
    });

    const noRoom = document.getElementById('noRoomMsg');
    if (noRoom) noRoom.style.display = anyVisible ? 'none' : '';
}

// ══ ROOM ═════════════════════════════════════════════════
function pickRoom(id, name) {
    document.querySelectorAll('.bk-room-card').forEach(c => c.classList.remove('bk-room-selected'));
    event.currentTarget.closest('label').querySelector('.bk-room-card').classList.add('bk-room-selected');
    document.getElementById('sv3').textContent = name;
    document.getElementById('confirmStep3').disabled = false;
}

// ══ TIMELINE ═════════════════════════════════════════════
// แปลงเวลา HH:mm เป็นนาทีนับจาก 14:00 (รองรับข้ามเที่ยงคืน)
function toMin(t) {
    const [h, m] = t.split(':').map(Number);
    const adj = h < 14 ? h + 24 : h; // 00-13 → 24-37
    return (adj - 14) * 60 + m;
}
// แปลงนาทีกลับเป็น HH:mm
function fromMin(min) {
    const total = (min + 14 * 60);
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

async function renderTimeline() {
    const roomId = document.querySelector('input[name="RoomId"]:checked')?.value;
    const date   = document.getElementById('inputDate').value;

    let booked = [];
    if (roomId && date) {
        try {
            const res = await fetch(`/User/GetBookedSlots?roomId=${roomId}&date=${date}`);
            booked = await res.json();
        } catch(e) { booked = []; }
    }

    // สร้าง slots ทุก 1 ชั่วโมง 14:00–02:00 (= 12 slots) — พอดี 1 หน้าไม่ต้อง scroll
    const SLOT_MIN    = 60;
    const TOTAL_SLOTS = 12;
    const slotLabels  = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        slotLabels.push(fromMin(i * SLOT_MIN));
    }

    // mark booked slots
    const bookedIdx = new Set();
    booked.forEach(b => {
        const sMin = toMin(b.start);
        // endTime ข้ามเที่ยงคืน: ถ้า end < start ให้บวก 24h
        let eMin = toMin(b.end);
        if (eMin <= sMin) eMin += 24 * 60;
        const si = Math.floor(sMin / SLOT_MIN);
        const ei = Math.ceil(eMin / SLOT_MIN);
        for (let i = si; i < ei && i < TOTAL_SLOTS; i++) bookedIdx.add(i);
    });

    let dragStart = null, dragEnd = null, isDragging = false;

    function renderSlots() {
        const mn = dragStart !== null && dragEnd !== null ? Math.min(dragStart, dragEnd) : -1;
        const mx = dragStart !== null && dragEnd !== null ? Math.max(dragStart, dragEnd) : -1;

        document.getElementById('tlGrid').innerHTML = slotLabels.map((label, i) => {
            const isBooked   = bookedIdx.has(i);
            const isSelected = !isBooked && mn >= 0 && i >= mn && i <= mx;
            const showLabel  = i % 2 === 0; // แสดง label ทุก 1 ชั่วโมง

            let bg     = isBooked ? 'var(--ns-ink2)' : isSelected ? 'var(--ns-ink)' : 'var(--ns-bg3)';
            let cursor = isBooked ? 'not-allowed' : 'pointer';
            let opacity= isBooked ? '.4' : '1';

            return `<div class="tl-slot${isBooked?' booked':''}"
                data-i="${i}"
                style="flex:1;min-width:0;height:44px;border-radius:3px;
                background:${bg};cursor:${cursor};opacity:${opacity};
                position:relative;transition:background .08s;">
                <span style="position:absolute;bottom:-17px;left:0;right:0;
                    text-align:center;font-size:.65rem;color:var(--ns-ink3);
                    white-space:nowrap;">${label}</span>
            </div>`;
        }).join('');

        attachSlotEvents();
    }

    function attachSlotEvents() {
        const grid = document.getElementById('tlGrid');
        grid.querySelectorAll('.tl-slot').forEach(el => {
            el.addEventListener('mousedown', e => {
                if (el.classList.contains('booked')) return;
                isDragging = true;
                dragStart = dragEnd = +el.dataset.i;
                renderSlots();
                updateSelection();
                e.preventDefault();
            });
            el.addEventListener('mouseenter', () => {
                if (!isDragging || el.classList.contains('booked')) return;
                dragEnd = +el.dataset.i;
                renderSlots();
                updateSelection();
            });
        });
    }

    function updateSelection() {
        if (dragStart === null || dragEnd === null) return;
        const mn = Math.min(dragStart, dragEnd);
        const mx = Math.max(dragStart, dragEnd);

        // เช็คว่าไม่ทับ booked
        for (let i = mn; i <= mx; i++) {
            if (bookedIdx.has(i)) {
                document.getElementById('tlMinWarning').textContent = '⚠ ช่วงเวลาที่เลือกทับกับการจองที่มีอยู่';
                document.getElementById('tlMinWarning').classList.remove('d-none');
                document.getElementById('confirmStep4').disabled = true;
                return;
            }
        }

        const span     = mx - mn + 1;
        const minSlots = 1; // ขั้นต่ำ 1 ชม. (1 slot)
        const startLbl = slotLabels[mn];
        const endIdx   = mx + 1;
        const endLbl   = endIdx < TOTAL_SLOTS ? slotLabels[endIdx] : '02:00';

        if (span < minSlots) {
            document.getElementById('tlMinWarning').textContent = '⚠ กรุณาเลือกอย่างน้อย 1 ชั่วโมง';
            document.getElementById('tlMinWarning').classList.remove('d-none');
            document.getElementById('confirmStep4').disabled = true;
        } else {
            document.getElementById('tlMinWarning').classList.add('d-none');
            document.getElementById('confirmStep4').disabled = false;
            document.getElementById('inputStart').value = startLbl;
            document.getElementById('inputEnd').value   = endLbl;
            document.getElementById('sv4').textContent  = startLbl + ' – ' + endLbl;
        }
    }

    document.addEventListener('mouseup', () => { isDragging = false; });

    // สร้าง HTML wrapper แบบ scroll
    document.getElementById('tlWrap').innerHTML = `
        <div id="tlGrid" style="display:flex;gap:3px;user-select:none;"></div>
        <div style="height:24px;"></div>`;

    renderSlots();
}

// ══ SUBMIT ═══════════════════════════════════════════════
function submitBooking() {
    const date  = document.getElementById('inputDate').value;
    const start = document.getElementById('inputStart').value;
    const end   = document.getElementById('inputEnd').value;
    const room  = document.querySelector('input[name="RoomId"]:checked');

    if (!date || !start || !end || !room) {
        alert('กรุณากรอกข้อมูลให้ครบทุกขั้นตอน');
        return;
    }
    document.getElementById('bookingForm').submit();
}

// ══ INIT ═════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const cal = document.getElementById('calMonth');
    if (cal) {
        const existing = document.getElementById('inputDate')?.value;
        if (existing) selDate = existing;
        renderCal();
        loadFullyBookedDates();
    }
});
