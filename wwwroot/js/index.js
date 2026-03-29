// ════════════════════════════
// SCROLL SNAP SYSTEM
// ════════════════════════════
const SECTIONS = ["s0", "s1", "s2", "s3", "s4"];
const SEC_LABELS = ["หน้าแรก", "เกี่ยวกับ", "ห้อง", "จอง", "การจองของฉัน"];
let currentSec = 0;

function buildNav() {
  const dots = document.getElementById("navDots");
  const si = document.getElementById("secIndicator");
  dots.innerHTML = "";
  si.innerHTML = "";
  SECTIONS.forEach((id, i) => {
    const d = document.createElement("button");
    d.className = "nav-dot" + (i === 0 ? " active" : "");
    d.title = SEC_LABELS[i];
    d.onclick = () => goTo(i);
    dots.appendChild(d);
    const s = document.createElement("button");
    s.className = "si-dot" + (i === 0 ? " active" : "");
    s.title = SEC_LABELS[i];
    s.onclick = () => goTo(i);
    si.appendChild(s);
  });
}
function goTo(i) {
  document.getElementById(SECTIONS[i]).scrollIntoView({ behavior: "smooth" });
}
function scrollNext() {
  if (currentSec < SECTIONS.length - 1) goTo(currentSec + 1);
}
function updateNav(i) {
  currentSec = i;
  document
    .querySelectorAll(".nav-dot")
    .forEach((d, idx) => d.classList.toggle("active", idx === i));
  document
    .querySelectorAll(".si-dot")
    .forEach((d, idx) => d.classList.toggle("active", idx === i));
  document.getElementById("progressBar").style.width =
    (i / (SECTIONS.length - 1)) * 100 + "%";
  const btn = document.getElementById("scrollBtn");
  if (i === SECTIONS.length - 1) {
    btn.textContent = "↑";
    btn.onclick = () => goTo(0);
    btn.classList.add("at-last");
  } else {
    btn.textContent = "↓";
    btn.onclick = scrollNext;
    btn.classList.remove("at-last");
  }
  triggerFadeIn(SECTIONS[i]);
}
const secObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) {
        const idx = SECTIONS.indexOf(e.target.id);
        if (idx >= 0) updateNav(idx);
      }
    });
  },
  { threshold: 0.5 },
);
SECTIONS.forEach((id) => {
  const el = document.getElementById(id);
  if (el) secObserver.observe(el);
});
function triggerFadeIn(secId) {
  document
    .getElementById(secId)
    .querySelectorAll(".fade-in")
    .forEach((el) => el.classList.add("visible"));
}
setTimeout(() => triggerFadeIn("s0"), 100);
buildNav();
updateNav(0);

// ════════════════════════════
// DATA
// ════════════════════════════
// ROOMS: read live rooms set by admin if available, else use defaults
const ROOMS_DEFAULT = [
  {
    id: "S1",
    name: "Galaxy S",
    type: "ห้องเล็ก",
    cap: 4,
    price: 390,
    emoji: "🎤",
  },
  {
    id: "M1",
    name: "Neon M",
    type: "ห้องกลาง",
    cap: 8,
    price: 590,
    emoji: "🎵",
  },
  {
    id: "M2",
    name: "Cyber M",
    type: "ห้องกลาง",
    cap: 8,
    price: 590,
    emoji: "🎶",
  },
  {
    id: "L1",
    name: "Star L",
    type: "ห้องใหญ่",
    cap: 12,
    price: 890,
    emoji: "🎸",
  },
  {
    id: "L2",
    name: "Aurora L",
    type: "ห้องใหญ่",
    cap: 12,
    price: 890,
    emoji: "🎹",
  },
  {
    id: "VIP",
    name: "VIP Galaxy",
    type: "VIP Suite",
    cap: 20,
    price: 1990,
    emoji: "🎺",
  },
];
const ROOMS = (() => {
  try {
    const live = JSON.parse(localStorage.getItem("ns_rooms_live") || "null");
    return live && live.length ? live : ROOMS_DEFAULT;
  } catch (e) {
    return ROOMS_DEFAULT;
  }
})();
const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const STEPS_TOTAL = 5;

function getBookings() {
  return JSON.parse(localStorage.getItem("ns_bookings") || "[]");
}
function saveBookings(b) {
  localStorage.setItem("ns_bookings", JSON.stringify(b));
}
function getUsers() {
  return JSON.parse(localStorage.getItem("ns_users") || "[]");
}
function saveUsers(u) {
  localStorage.setItem("ns_users", JSON.stringify(u));
}

(() => {
  const u = getUsers();
  if (!u.length)
    saveUsers([
      {
        name: "สมชาย ใจดี",
        phone: "081-234-5678",
        email: "demo@demo.com",
        pass: "demo123",
      },
    ]);
})();
(() => {
  if (!getBookings().length) {
    const today = new Date(),
      fmt = (d) => d.toISOString().split("T")[0],
      dp = (n) => {
        const x = new Date(today);
        x.setDate(today.getDate() + n);
        return x;
      };
    saveBookings([
      {
        code: "NS-1001",
        userEmail: "demo@demo.com",
        userName: "สมชาย ใจดี",
        room: "M1",
        roomName: "Neon M",
        date: fmt(dp(1)),
        start: "18:00",
        end: "21:00",
        people: 5,
        total: 1770,
        status: "confirmed",
        payMethod: "counter",
      },
      {
        code: "NS-1002",
        userEmail: "demo@demo.com",
        userName: "สมชาย ใจดี",
        room: "L1",
        roomName: "Star L",
        date: fmt(dp(2)),
        start: "20:00",
        end: "23:00",
        people: 10,
        total: 2670,
        status: "confirmed",
        payMethod: "promptpay",
      },
      {
        code: "NS-1003",
        userEmail: "jane@test.com",
        userName: "วิไล รัตน์",
        room: "S1",
        roomName: "Galaxy S",
        date: fmt(dp(3)),
        start: "16:15",
        end: "18:00",
        people: 2,
        total: 585,
        status: "pending",
        payMethod: "counter",
      },
    ]);
  }
})();

// ════════════════════════════
// AUTH
// ════════════════════════════
let currentUser = null;
function openAuth() {
  document.getElementById("authOverlay").style.display = "flex";
}
function closeAuth() {
  document.getElementById("authOverlay").style.display = "none";
}
document.getElementById("authOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeAuth();
});

function switchTab(t) {
  document
    .querySelectorAll(".auth-tab")
    .forEach((el, i) =>
      el.classList.toggle("active", i === (t === "login" ? 0 : 1)),
    );
  document.getElementById("loginForm").style.display =
    t === "login" ? "flex" : "none";
  document.getElementById("regForm").style.display =
    t === "register" ? "flex" : "none";
  document.getElementById("lErr").style.display = "none";
  document.getElementById("rErr").style.display = "none";
}
function doLogin() {
  const email = document.getElementById("lEmail").value.trim(),
    pass = document.getElementById("lPass").value;
  const u = getUsers().find((u) => u.email === email && u.pass === pass);
  if (!u) {
    document.getElementById("lErr").style.display = "block";
    return;
  }
  currentUser = u;
  closeAuth();
  document.getElementById("navRight").innerHTML =
    `<span class="nav-user">สวัสดี, ${u.name.split(" ")[0]}</span><a href="profile.html" style="background:transparent;border:1px solid var(--border-md);border-radius:3px;color:var(--ink);font-family:'Kanit',sans-serif;font-size:.72rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 14px;cursor:pointer;text-decoration:none;">โปรไฟล์</a><button class="nav-btn ghost" onclick="doLogout()">ออก</button>`;
  const n = document.getElementById("bookingLoginNudge");
  if (n) n.style.display = "none";
  initCalendar();
  renderMyBookings();
  showToast("ยินดีต้อนรับ, " + u.name.split(" ")[0]);
}
function doRegister() {
  const name = document.getElementById("rName").value.trim(),
    phone = document.getElementById("rPhone").value.trim(),
    email = document.getElementById("rEmail").value.trim(),
    pass = document.getElementById("rPass").value;
  const err = document.getElementById("rErr");
  if (!name || !phone || !email || pass.length < 6) {
    err.textContent = "กรุณากรอกข้อมูลให้ครบ (รหัสผ่านอย่างน้อย 6 ตัว)";
    err.style.display = "block";
    return;
  }
  const users = getUsers();
  if (users.find((u) => u.email === email)) {
    err.textContent = "อีเมลนี้ถูกใช้งานแล้ว";
    err.style.display = "block";
    return;
  }
  users.push({ name, phone, email, pass });
  saveUsers(users);
  currentUser = { name, phone, email, pass };
  closeAuth();
  document.getElementById("navRight").innerHTML =
    `<span class="nav-user">สวัสดี, ${name.split(" ")[0]}</span><a href="profile.html" style="background:transparent;border:1px solid var(--border-md);border-radius:3px;color:var(--ink);font-family:'Kanit',sans-serif;font-size:.72rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 14px;cursor:pointer;text-decoration:none;">โปรไฟล์</a><button class="nav-btn ghost" onclick="doLogout()">ออก</button>`;
  const n = document.getElementById("bookingLoginNudge");
  if (n) n.style.display = "none";
  initCalendar();
  renderMyBookings();
  showToast("สมัครสมาชิกสำเร็จ!");
}
function doLogout() {
  currentUser = null;
  document.getElementById("navRight").innerHTML =
    `<button class="nav-btn ghost" onclick="openAuth()">เข้าสู่ระบบ</button><button class="nav-btn" onclick="goBooking()">จองเลย</button>`;
  const n = document.getElementById("bookingLoginNudge");
  if (n) n.style.display = "";
  renderMyBookings();
  goTo(0);
}
function requireLogin() {
  if (currentUser) return true;
  openAuth();
  return false;
}
function goBooking() {
  if (currentUser) goTo(3);
  else openAuth();
}

// ════════════════════════════
// CALENDAR — 7-day limit
// ════════════════════════════
let calY,
  calM,
  selDate = null;
function initCalendar() {
  const n = new Date();
  calY = n.getFullYear();
  calM = n.getMonth();
  renderCal();
}
function prevMonth() {
  calM--;
  if (calM < 0) {
    calM = 11;
    calY--;
  }
  renderCal();
}
function nextMonth() {
  calM++;
  if (calM > 11) {
    calM = 0;
    calY++;
  }
  renderCal();
}
const DOWS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function renderCal() {
  document.getElementById("calMonth").textContent =
    MONTHS_TH[calM] + " " + (calY + 543);
  const g = document.getElementById("calGrid");
  g.innerHTML = "";
  DOWS.forEach((d) => {
    const el = document.createElement("div");
    el.className = "cal-dow";
    el.textContent = d;
    g.appendChild(el);
  });
  const first = new Date(calY, calM, 1).getDay();
  const days = new Date(calY, calM + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 7);
  const bkDates = new Set(getBookings().map((b) => b.date));
  for (let i = 0; i < first; i++) {
    const el = document.createElement("div");
    el.className = "cal-day empty";
    g.appendChild(el);
  }
  for (let d = 1; d <= days; d++) {
    const iso = `${calY}-${String(calM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const date = new Date(calY, calM, d);
    date.setHours(0, 0, 0, 0);
    const el = document.createElement("div");
    el.className = "cal-day";
    el.textContent = d;
    // disable: past or beyond 7 days
    if (date < today || date > maxDate) {
      el.classList.add("disabled");
    } else {
      if (date.getTime() === today.getTime()) el.classList.add("today");
      if (bkDates.has(iso)) el.classList.add("has-bk");
      if (selDate === iso) el.classList.add("selected");
      el.onclick = () => {
        selDate = iso;
        renderCal();
        // enable confirm
        document.getElementById("confirmStep1").disabled = false;
      };
    }
    g.appendChild(el);
  }
}

// ════════════════════════════
// STEP CONTROLLER
// ════════════════════════════
function unlockStep(n) {
  const s = document.getElementById("step" + n);
  if (s) {
    s.classList.remove("locked");
  }
}
function openStep(n) {
  for (let i = 1; i <= STEPS_TOTAL; i++) {
    const s = document.getElementById("step" + i);
    if (!s) continue;
    if (i === n) {
      s.classList.add("active");
      s.classList.remove("locked");
    } else if (!s.classList.contains("locked")) s.classList.remove("active");
  }
  if (n === 4) buildTimeline();
  if (n === 5) buildReview();
}
function toggleStep(n) {
  const s = document.getElementById("step" + n);
  if (!s || s.classList.contains("locked") || s.classList.contains("active"))
    return;
  openStep(n);
}

// confirmStep: validate then advance
function confirmStep(n) {
  if (n === 1) {
    if (!selDate) {
      showToast("กรุณาเลือกวันที่");
      return;
    }
    setStepDone(1, fmtDate(selDate));
    unlockStep(2);
    openStep(2);
  } else if (n === 2) {
    setStepDone(2, numPpl + " คน");
    // reset room+time when people changes
    selRoom = null;
    selStart = null;
    selEnd = null;
    unlockStep(3);
    openStep(3);
    renderRoomCards();
  } else if (n === 3) {
    if (!selRoom) {
      showToast("กรุณาเลือกห้อง");
      return;
    }
    const room = ROOMS.find((r) => r.id === selRoom);
    setStepDone(3, room.emoji + " " + room.name);
    selStart = null;
    selEnd = null;
    unlockStep(4);
    openStep(4);
  } else if (n === 4) {
    if (selStart === null || selEnd === null) {
      showToast("กรุณาเลือกช่วงเวลา");
      return;
    }
    if (selEnd - selStart < 4) {
      showToast("จองขั้นต่ำ 1 ชั่วโมง");
      return;
    }
    if (rangeOverlapsBuf(selStart, selEnd, selRoom, selDate)) {
      showToast("ช่วงเวลานี้ไม่ว่าง");
      return;
    }
    const st = slotToTime(selStart),
      et = slotToTime(selEnd);
    setStepDone(4, st + " – " + et);
    unlockStep(5);
    openStep(5);
  }
}
function setStepDone(n, val) {
  document.getElementById("sv" + n).textContent = val;
  document.getElementById("sv" + n).classList.add("filled");
  document.getElementById("sn" + n).textContent = "✓";
}

// ════════════════════════════
// PEOPLE
// ════════════════════════════
let numPpl = 2;
function chgPpl(d) {
  numPpl = Math.max(1, Math.min(20, numPpl + d));
  document.getElementById("pplNum").textContent = numPpl;
}

// ════════════════════════════
// ROOM CARDS (step 3)
// ════════════════════════════
let selRoom = null;
function renderRoomCards() {
  const el = document.getElementById("roomCards");
  el.innerHTML = "";
  ROOMS.forEach((r) => {
    if (r.cap < numPpl) return;
    const card = document.createElement("div");
    card.className = "room-card-sel" + (selRoom === r.id ? " rc-selected" : "");
    card.innerHTML = `<div class="rc-emoji-s">${r.emoji}</div><div class="rc-name-s">${r.name}</div><div class="rc-cap-s">${r.type} · ≤${r.cap} คน</div><div class="rc-price-s">฿${r.price.toLocaleString()}<span>/ชม.</span></div>`;
    card.onclick = () => {
      selRoom = r.id;
      document
        .querySelectorAll(".room-card-sel")
        .forEach((c) => c.classList.remove("rc-selected"));
      card.classList.add("rc-selected");
      document.getElementById("confirmStep3").disabled = false;
    };
    el.appendChild(card);
  });
  document.getElementById("confirmStep3").disabled = !selRoom;
}

// ════════════════════════════
// TIMELINE (step 4) — 15-min slots
// ════════════════════════════
const TL_START_H = 14,
  TL_SLOTS = 48;
function slotToTime(slot) {
  const tm = TL_START_H * 60 + slot * 15,
    h = Math.floor(tm / 60) % 24,
    m = tm % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
function timeToSlot(t) {
  const [h, m] = t.split(":").map(Number),
    adj = h < TL_START_H ? h + 24 : h;
  return (adj - TL_START_H) * 4 + m / 15;
}
function rangeOverlapsBuf(s1, e1, roomId, date) {
  return getBookings()
    .filter((b) => b.room === roomId && b.date === date)
    .some((b) => {
      const bs = timeToSlot(b.start),
        be = timeToSlot(b.end);
      return s1 < be && e1 > bs;
    });
}

let selStart = null,
  selEnd = null,
  dragging = false,
  dragStartSlot = null;

function buildTimeline() {
  const wrap = document.getElementById("tlWrap");
  wrap.innerHTML = "";
  if (!selDate || !selRoom) return;
  // hour labels
  const hdr = document.createElement("div");
  hdr.className = "tl-header";
  for (let h = 0; h < 12; h++) {
    const lbl = document.createElement("div");
    lbl.className = "tl-hour-label";
    lbl.textContent = String((TL_START_H + h) % 24).padStart(2, "0") + ":00";
    hdr.appendChild(lbl);
  }
  wrap.appendChild(hdr);

  const rows = document.createElement("div");
  rows.className = "tl-rows";
  const bks = getBookings().filter(
    (b) => b.date === selDate && b.room === selRoom,
  );
  // single row for selected room
  const room = ROOMS.find((r) => r.id === selRoom);
  const row = document.createElement("div");
  row.className = "tl-row";
  const nm = document.createElement("div");
  nm.className = "tl-room-name";
  nm.textContent = room ? room.name.replace("ห้อง ", "") : "";
  row.appendChild(nm);

  const track = document.createElement("div");
  track.className = "tl-track";
  track.dataset.room = selRoom;
  // ticks
  for (let s = 4; s < TL_SLOTS; s += 4) {
    const t = document.createElement("div");
    t.className = "tl-tick";
    t.style.left = (s / TL_SLOTS) * 100 + "%";
    track.appendChild(t);
  }
  // booked segments
  bks.forEach((bk) => {
    const bs = timeToSlot(bk.start),
      be = timeToSlot(bk.end);
    const seg = document.createElement("div");
    seg.className = "tl-seg tl-seg-booked";
    seg.style.left = (bs / TL_SLOTS) * 100 + "%";
    seg.style.width = ((be - bs) / TL_SLOTS) * 100 + "%";
    seg.title = bk.start + "–" + bk.end;
    track.appendChild(seg);
  });
  // selection
  const sd = document.createElement("div");
  sd.className = "tl-selection";
  sd.id = "tlsel-main";
  sd.style.display = "none";
  const sl = document.createElement("div");
  sl.className = "tl-sel-label";
  sd.appendChild(sl);
  track.appendChild(sd);

  const getSlot = (e) => {
    const rect = track.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(
      0,
      Math.min(
        TL_SLOTS - 1,
        Math.floor(((cx - rect.left) / rect.width) * TL_SLOTS),
      ),
    );
  };
  track.addEventListener("mousedown", (e) => {
    dragging = true;
    dragStartSlot = getSlot(e);
    selStart = dragStartSlot;
    selEnd = dragStartSlot + 1;
    redrawSel();
  });
  track.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const s = getSlot(e);
    if (s + 1 > dragStartSlot) {
      selStart = dragStartSlot;
      selEnd = s + 1;
    } else {
      selStart = s;
      selEnd = dragStartSlot + 1;
    }
    redrawSel();
    validateMin();
  });
  track.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    finalizeSel();
  });
  track.addEventListener("mouseleave", () => {
    if (dragging) {
      dragging = false;
      finalizeSel();
    }
  });
  track.addEventListener(
    "touchstart",
    (e) => {
      dragging = true;
      dragStartSlot = getSlot(e);
      selStart = dragStartSlot;
      selEnd = dragStartSlot + 1;
      redrawSel();
    },
    { passive: true },
  );
  track.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      const s = getSlot(e);
      if (s + 1 > dragStartSlot) {
        selStart = dragStartSlot;
        selEnd = s + 1;
      } else {
        selStart = s;
        selEnd = dragStartSlot + 1;
      }
      redrawSel();
      validateMin();
    },
    { passive: true },
  );
  track.addEventListener("touchend", () => {
    if (!dragging) return;
    dragging = false;
    finalizeSel();
  });
  row.appendChild(track);
  rows.appendChild(row);
  wrap.appendChild(rows);
  if (selStart !== null) redrawSel();
}

function finalizeSel() {
  // trim if overlaps existing booking
  let newEnd = selEnd;
  const bks = getBookings().filter(
    (b) => b.room === selRoom && b.date === selDate,
  );
  for (let s = selStart; s < selEnd; s++) {
    if (
      bks.some((b) => {
        const bs = timeToSlot(b.start),
          be = timeToSlot(b.end);
        return s >= bs && s < be;
      })
    ) {
      newEnd = s;
      break;
    }
  }
  selEnd = newEnd;
  if (selEnd <= selStart) {
    selStart = null;
    selEnd = null;
  }
  redrawSel();
  validateMin();
}

function validateMin() {
  const dur = selStart !== null && selEnd !== null ? selEnd - selStart : 0;
  const ok = dur >= 4;
  document.getElementById("tlMinWarning").style.display =
    selStart !== null && selEnd !== null && !ok ? "block" : "none";
  document.getElementById("confirmStep4").disabled = !ok;
  if (ok) {
    document.getElementById("sv4").textContent =
      slotToTime(selStart) +
      " – " +
      slotToTime(selEnd) +
      " (" +
      (dur * 15) / 60 +
      " ชม.)";
    document.getElementById("sv4").classList.add("filled");
  }
}

function redrawSel() {
  const sd = document.getElementById("tlsel-main");
  if (!sd) return;
  if (selStart === null || selEnd === null) {
    sd.style.display = "none";
    return;
  }
  sd.style.left = (selStart / TL_SLOTS) * 100 + "%";
  sd.style.width = ((selEnd - selStart) / TL_SLOTS) * 100 + "%";
  sd.style.display = "flex";
  sd.style.opacity = "0.88";
  sd.querySelector(".tl-sel-label").textContent =
    slotToTime(selStart) + " – " + slotToTime(selEnd);
}

// ════════════════════════════
// REVIEW (step 5)
// ════════════════════════════
// ════════════════════════════
// PROMO CODE
// ════════════════════════════
let appliedPromo = null;

function getPromos() {
  return JSON.parse(localStorage.getItem("ns_promos") || "[]");
}

function applyPromo() {
  const code = document.getElementById("promoInput").value.trim().toUpperCase();
  const msg = document.getElementById("promoMsg");
  if (!code) {
    msg.innerHTML = '<span style="color:#b03030;">กรุณาใส่รหัสโปรโมชั่น</span>';
    return;
  }
  if (!selRoom || selStart === null || selEnd === null) {
    msg.innerHTML =
      '<span style="color:#b03030;">กรุณาเลือกห้องและเวลาก่อน</span>';
    return;
  }
  const today = new Date().toISOString().split("T")[0];
  const promos = getPromos();
  const p = promos.find(
    (x) =>
      x.code === code &&
      x.status === "active" &&
      x.start <= today &&
      x.end >= today &&
      x.used < x.limit,
  );
  if (!p) {
    appliedPromo = null;
    msg.innerHTML =
      '<span style="color:#b03030;">รหัสโปรโมชั่นไม่ถูกต้อง หมดอายุ หรือใช้หมดแล้ว</span>';
    refreshReviewTotal();
    return;
  }
  // check room restriction
  if (p.room && p.room !== selRoom) {
    const rName = ROOMS.find((r) => r.id === p.room)?.name || p.room;
    msg.innerHTML = `<span style="color:#b03030;">โปรโมชั่นนี้ใช้ได้เฉพาะ ${rName} เท่านั้น</span>`;
    appliedPromo = null;
    refreshReviewTotal();
    return;
  }
  appliedPromo = p;
  const disc = calcDiscount(p);
  msg.innerHTML = `<span style="color:#2a7a44;">✓ ใช้โปรโมชั่น ${p.code} — ${p.desc} (ลด ${disc > 0 ? "฿" + disc.toLocaleString() : ""})</span>`;
  refreshReviewTotal();
}

function calcDiscount(p) {
  if (!p || !selRoom || selStart === null || selEnd === null) return 0;
  const room = ROOMS.find((r) => r.id === selRoom);
  const dur = ((selEnd - selStart) * 15) / 60;
  const base = Math.round(room.price * dur);
  if (p.type === "percent") return Math.round((base * p.value) / 100);
  if (p.type === "fixed") return Math.min(p.value, base);
  if (p.type === "free_hour")
    return Math.round(room.price * Math.min(p.value, dur));
  return 0;
}

function refreshReviewTotal() {
  const room = ROOMS.find((r) => r.id === selRoom);
  if (!room) return;
  const dur = ((selEnd - selStart) * 15) / 60;
  const base = Math.round(room.price * dur);
  const disc = appliedPromo ? calcDiscount(appliedPromo) : 0;
  const final = Math.max(0, base - disc);
  const discRow = document.getElementById("discountRow");
  const discEl = document.getElementById("sumDiscount");
  if (disc > 0 && discRow && discEl) {
    discRow.style.display = "flex";
    discEl.textContent = "-฿" + disc.toLocaleString();
  } else if (discRow) {
    discRow.style.display = "none";
  }
  document.getElementById("sumTotal").textContent =
    "฿" + final.toLocaleString();
  const ca = document.getElementById("cardPayAmt");
  if (ca) ca.textContent = "฿" + final.toLocaleString();
  document.getElementById("sv5").textContent = "฿" + final.toLocaleString();
}

function clearPromo() {
  // only clear visual, not appliedPromo (user might retype)
  appliedPromo = null;
  document.getElementById("promoMsg").innerHTML = "";
  document.getElementById("discountRow").style.display = "none";
  refreshReviewTotal();
}

function buildReview() {
  const room = ROOMS.find((r) => r.id === selRoom);
  const dur = ((selEnd - selStart) * 15) / 60;
  const total = Math.round(room.price * dur);
  document.getElementById("sumDate").textContent = fmtDate(selDate);
  document.getElementById("sumTime").textContent =
    slotToTime(selStart) + " – " + slotToTime(selEnd);
  document.getElementById("sumDur").textContent = dur + " ชั่วโมง";
  document.getElementById("sumPpl").textContent = numPpl + " คน";
  document.getElementById("sumRoom").textContent = room.emoji + " " + room.name;
  // only reset promo if room/time changed (fresh build)
  appliedPromo = null;
  const pi = document.getElementById("promoInput");
  if (pi) pi.value = "";
  const pm = document.getElementById("promoMsg");
  if (pm) pm.innerHTML = "";
  const dr = document.getElementById("discountRow");
  if (dr) dr.style.display = "none";
  document.getElementById("sumTotal").textContent =
    "฿" + total.toLocaleString();
  const ca = document.getElementById("cardPayAmt");
  if (ca) ca.textContent = "฿" + total.toLocaleString();
  document.getElementById("sv5").textContent = "฿" + total.toLocaleString();
  document.getElementById("sv5").classList.add("filled");
}

// ════════════════════════════
// PAYMENT
// ════════════════════════════
let selPay = "counter";
function selectPay(method) {
  selPay = method;
  ["counter", "promptpay", "card"].forEach((m) => {
    document.getElementById("pm-" + m).classList.toggle("active", m === method);
    document.getElementById("paySimCounter").style.display =
      method === "counter" ? "block" : "none";
    document.getElementById("paySimPromptpay").style.display =
      method === "promptpay" ? "block" : "none";
    document.getElementById("paySimCard").style.display =
      method === "card" ? "block" : "none";
  });
}
function simPay(method) {
  // simulate processing
  const btn = document.querySelector(
    "#paySimPromptpay .pay-btn-pp, #paySimCard .pay-btn-card",
  );
  if (method === "promptpay") {
    const b = document.querySelector("#paySimPromptpay .pay-btn-pp");
    b.textContent = "⏳ กำลังตรวจสอบ...";
    b.disabled = true;
    setTimeout(() => doBook(), 1500);
  } else {
    const num = document.getElementById("cardNum").value.replace(/\s/g, "");
    const name = document.getElementById("cardName").value.trim();
    const exp = document.getElementById("cardExp").value;
    const cvv = document.getElementById("cardCvv").value;
    if (num.length < 16 || !name || exp.length < 5 || cvv.length < 3) {
      showToast("กรุณากรอกข้อมูลบัตรให้ครบ");
      return;
    }
    const b = document.querySelector("#paySimCard .pay-btn-card");
    b.textContent = "⏳ กำลังประมวลผล...";
    b.disabled = true;
    setTimeout(() => doBook(), 2000);
  }
}
function fmtCard(input) {
  let v = input.value.replace(/\D/g, "").slice(0, 16);
  input.value = v.match(/.{1,4}/g)?.join(" ") || v;
  document.getElementById("cardNumDisplay").textContent =
    input.value || "•••• •••• •••• ••••";
}
function fmtExp(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
  input.value = v;
  document.getElementById("cardExpDisplay").textContent = v || "MM/YY";
}

// ════════════════════════════
// BOOK
// ════════════════════════════
function doBook() {
  if (!requireLogin()) return;
  const room = ROOMS.find((r) => r.id === selRoom);
  if (rangeOverlapsBuf(selStart, selEnd, selRoom, selDate)) {
    showToast("ช่วงเวลานี้ไม่ว่างแล้ว");
    return;
  }
  const dur = ((selEnd - selStart) * 15) / 60;
  const base = Math.round(room.price * dur);
  const disc = appliedPromo ? calcDiscount(appliedPromo) : 0;
  const total = Math.max(0, base - disc);
  const code = "NS-" + Math.floor(1000 + Math.random() * 9000);
  const payLabels = {
    counter: "ชำระที่เคาน์เตอร์",
    promptpay: "PromptPay",
    card: "บัตรเครดิต/เดบิต",
  };
  const bk = {
    code,
    userEmail: currentUser.email,
    userName: currentUser.name,
    room: selRoom,
    roomName: room.name,
    date: selDate,
    start: slotToTime(selStart),
    end: slotToTime(selEnd),
    people: numPpl,
    total,
    discount: disc,
    promoCode: appliedPromo?.code || null,
    status: "confirmed",
    payMethod: selPay,
  };
  const bks = getBookings();
  bks.push(bk);
  saveBookings(bks);
  // increment promo usage
  if (appliedPromo) {
    const promos = getPromos();
    const pi = promos.findIndex((p) => p.id === appliedPromo.id);
    if (pi >= 0) {
      promos[pi].used = (promos[pi].used || 0) + 1;
      localStorage.setItem("ns_promos", JSON.stringify(promos));
    }
  }
  document.getElementById("mCode").textContent = code;
  document.getElementById("mPayMethod").textContent =
    "ชำระผ่าน: " +
    payLabels[selPay] +
    (disc > 0 ? " · ส่วนลด ฿" + disc.toLocaleString() : "");
  document.getElementById("successModal").classList.add("active");
  resetBooking();
  renderMyBookings();
  renderCal();
}
function closeSuccess() {
  document.getElementById("successModal").classList.remove("active");
}

function resetBooking() {
  selDate = null;
  selStart = null;
  selEnd = null;
  selRoom = null;
  numPpl = 2;
  selPay = "counter";
  appliedPromo = null;
  document.getElementById("pplNum").textContent = "2";
  // reset promo UI
  const pi = document.getElementById("promoInput");
  if (pi) pi.value = "";
  const pm = document.getElementById("promoMsg");
  if (pm) pm.innerHTML = "";
  const dr = document.getElementById("discountRow");
  if (dr) dr.style.display = "none";
  for (let i = 1; i <= STEPS_TOTAL; i++) {
    const s = document.getElementById("step" + i);
    if (!s) continue;
    if (i === 1) {
      s.classList.remove("locked");
      s.classList.add("active");
    } else {
      s.classList.add("locked");
      s.classList.remove("active");
    }
    const sv = document.getElementById("sv" + i);
    if (sv) {
      sv.classList.remove("filled");
      sv.textContent = [
        "จองล่วงหน้าได้สูงสุด 7 วัน",
        "เลือกวันก่อน",
        "เลือกจำนวนคนก่อน",
        "เลือกห้องก่อน",
        "รอข้อมูลการจอง",
      ][i - 1];
    }
    const sn = document.getElementById("sn" + i);
    if (sn) sn.textContent = i;
  }
  document.getElementById("confirmStep1").disabled = true;
  document.getElementById("confirmStep3").disabled = true;
  document.getElementById("confirmStep4").disabled = true;
  // reset card pay form
  selectPay("counter");
  ["cardNum", "cardName", "cardExp", "cardCvv"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("cardNumDisplay").textContent = "•••• •••• •••• ••••";
  document.getElementById("cardNameDisplay").textContent = "YOUR NAME";
  document.getElementById("cardExpDisplay").textContent = "MM/YY";
  // reset pay buttons
  const bpp = document.querySelector("#paySimPromptpay .pay-btn-pp");
  if (bpp) {
    bpp.textContent = "✓ ยืนยันการชำระเงิน (จำลอง)";
    bpp.disabled = false;
  }
  const bcard = document.querySelector("#paySimCard .pay-btn-card");
  if (bcard) {
    bcard.disabled = false;
  }
}

function fmtDate(iso) {
  const [y, m, d] = iso.split("-");
  return (
    parseInt(d) + " " + MONTHS_TH[parseInt(m) - 1] + " " + (parseInt(y) + 543)
  );
}

// ════════════════════════════
// MY BOOKINGS
// ════════════════════════════
function renderMyBookings() {
  const el = document.getElementById("bkGrid");
  if (!currentUser) {
    el.innerHTML =
      '<div style="padding:1.5rem 1.4rem;font-size:.85rem;color:var(--ink3);display:flex;align-items:center;gap:.75rem;"><span>กรุณาเข้าสู่ระบบเพื่อดูการจอง</span><button onclick="openAuth()" style="background:var(--ink);border:none;border-radius:2px;color:var(--bg);font-family:Kanit,sans-serif;font-size:.72rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 14px;cursor:pointer;">เข้าสู่ระบบ</button></div>';
    return;
  }
  const bks = getBookings().filter((b) => b.userEmail === currentUser.email);
  if (!bks.length) {
    el.innerHTML =
      '<div style="padding:1.5rem;font-size:.85rem;color:var(--ink3);">ยังไม่มีการจอง</div>';
    return;
  }
  const payLabels = {
    counter: "🏦 เคาน์เตอร์",
    promptpay: "📱 PromptPay",
    card: "💳 บัตร",
  };
  el.innerHTML = bks
    .slice()
    .reverse()
    .map(
      (b) => `<div class="bk-card">
    <div class="bk-code">${b.code}</div>
    <div class="bk-room">${b.roomName}</div>
    <div class="bk-info">${fmtDate(b.date)}<br>${b.start} – ${b.end} · ${b.people} คน<br>฿${b.total.toLocaleString()} · ${payLabels[b.payMethod] || "—"}${b.promoCode ? `<br><span style="color:#2a7a44;font-size:.75rem;">✦ ${b.promoCode}${b.discount ? " (ลด ฿" + b.discount.toLocaleString() + ")" : ""}</span>` : ""}</div>
    <span class="bk-tag ${b.status === "confirmed" ? "tag-c" : "tag-p"}">${b.status === "confirmed" ? "ยืนยันแล้ว" : "รอดำเนินการ"}</span>
  </div>`,
    )
    .join("");
}

// ════════════════════════════
// TOAST
// ════════════════════════════
function showToast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toastTxt").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

// init
initCalendar();
renderMyBookings();
