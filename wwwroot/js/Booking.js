// ══ CALENDAR ═════════════════════════════════════════════
let calDate = new Date();
const M_TH  = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
let selDate = null;

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
        const iso = dt.toISOString().split('T')[0];
        const ok  = dt >= today && dt <= max;
        const act = selDate === iso;
        html += `<div onclick="${ok ? `pickDate('${iso}')` : ''}"
            style="padding:6px 2px;border-radius:3px;cursor:${ok?'pointer':'default'};
            font-size:.82rem;font-family:'Kanit',sans-serif;font-weight:${act?700:500};
            background:${act?'var(--ns-ink)':'transparent'};
            color:${act?'var(--ns-bg)':ok?'var(--ns-ink)':'var(--ns-bg3)'};
            transition:background .15s;">${d}</div>`;
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
    // filter room cards ตาม people ที่เลือก
    document.querySelectorAll('input[name="RoomId"]').forEach(radio => {
        const roomId = parseInt(radio.value);
        const room   = ROOMS_DATA.find(r => r.id === roomId);
        const col    = radio.closest('.col-12');
        if (col) col.style.display = room && room.size >= parseInt(val) ? '' : 'none';
    });
}

// ══ ROOM ═════════════════════════════════════════════════
function pickRoom(id, name) {
    document.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.closest('label').querySelector('.room-card').classList.add('selected');
    document.getElementById('sv3').textContent = name;
    document.getElementById('confirmStep3').disabled = false;
}

// ══ TIMELINE ═════════════════════════════════════════════
function renderTimeline() {
    const slots = [];
    for (let h = 14; h < 26; h++)
        for (let m = 0; m < 60; m += 15)
            slots.push(String(h%24).padStart(2,'0') + ':' + String(m).padStart(2,'0'));

    let dragging = false, dragStart = null;

    document.getElementById('tlWrap').innerHTML =
        `<div id="tlGrid" style="display:grid;grid-template-columns:repeat(${slots.length},1fr);gap:2px;user-select:none;">
        ${slots.map((s,i) => `<div class="tl-slot" data-i="${i}" data-t="${s}"
            style="height:40px;border-radius:2px;background:var(--ns-bg3);cursor:pointer;position:relative;">
            ${i%4===0?`<span style="position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:.55rem;color:var(--ns-ink3);white-space:nowrap;">${s}</span>`:''}
        </div>`).join('')}
        </div><div style="height:24px;"></div>`;

    const grid = document.getElementById('tlGrid');

    function highlight(from, to) {
        const mn = Math.min(from,to), mx = Math.max(from,to);
        grid.querySelectorAll('.tl-slot').forEach(el => {
            el.style.background = (+el.dataset.i >= mn && +el.dataset.i <= mx)
                ? 'var(--ns-ink)' : 'var(--ns-bg3)';
        });
        const span = mx - mn + 1;
        document.getElementById('tlMinWarning').classList.toggle('d-none', span >= 4);
        document.getElementById('confirmStep4').disabled = span < 4;
        if (span >= 4) {
            document.getElementById('inputStart').value = slots[mn];
            document.getElementById('inputEnd').value   = slots[mx+1] || '02:00';
            document.getElementById('sv4').textContent  = slots[mn] + ' – ' + (slots[mx+1] || '02:00');
        }
    }

    grid.addEventListener('mousedown', e => {
        const s = e.target.closest('.tl-slot'); if (!s) return;
        dragging = true; dragStart = +s.dataset.i; highlight(dragStart, dragStart);
    });
    grid.addEventListener('mousemove', e => {
        if (!dragging) return;
        const s = e.target.closest('.tl-slot'); if (!s) return;
        highlight(dragStart, +s.dataset.i);
    });
    document.addEventListener('mouseup', () => { dragging = false; });
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
        // ถ้ามีวันที่เลือกไว้แล้ว (กรณี validation fail)
        const existing = document.getElementById('inputDate')?.value;
        if (existing) selDate = existing;
        renderCal();
    }
});
