const ROOMS = [
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
const DOWS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const TL_START_H = 14,
  TL_SLOTS = 48,
  STEPS_TOTAL = 5;
function getBookings() {
  return JSON.parse(localStorage.getItem("ns_bookings") || "[]");
}
function saveBookings(b) {
  localStorage.setItem("ns_bookings", JSON.stringify(b));
}
function getUsers() {
  return JSON.parse(localStorage.getItem("ns_users") || "[]");
}
function getPromos() {
  return JSON.parse(localStorage.getItem("ns_promos") || "[]");
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
        joinedAt: "2024-01-01",
      },
    ]);
  function saveUsers(u) {
    localStorage.setItem("ns_users", JSON.stringify(u));
  }
})();
let currentUser = JSON.parse(sessionStorage.getItem("ns_user") || "null");
if (currentUser) {
  document.getElementById("loginNudge").style.display = "none";
  document
    .querySelector(".navbar-nav")
    .insertAdjacentHTML(
      "beforeend",
      `<li class="nav-item"><button class="btn btn-outline-secondary btn-sm px-3" onclick="doLogout()">ออก</button></li>`,
    );
}
function doLogout() {
  sessionStorage.removeItem("ns_user");
  location.href = "index";
}

// Toast (Bootstrap)
function showToast(msg) {
  document.getElementById("toastBody").textContent = msg;
  const t = new bootstrap.Toast(document.getElementById("liveToast"), {
    delay: 2500,
  });
  t.show();
}

// Calendar
let calY,
  calM,
  selDate = null;
(() => {
  const n = new Date();
  calY = n.getFullYear();
  calM = n.getMonth();
  renderCal();
})();
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
  const first = new Date(calY, calM, 1).getDay(),
    days = new Date(calY, calM + 1, 0).getDate();
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
    if (date < today || date > maxDate) {
      el.classList.add("disabled");
    } else {
      if (date.getTime() === today.getTime()) el.classList.add("today");
      if (bkDates.has(iso)) el.classList.add("has-bk");
      if (selDate === iso) el.classList.add("selected");
      el.onclick = () => {
        selDate = iso;
        renderCal();
        document.getElementById("confirmStep1").disabled = false;
      };
    }
    g.appendChild(el);
  }
}

// Steps
let numPpl = 2,
  selRoom = null,
  selStart = null,
  selEnd = null,
  dragging = false,
  dragStartSlot = null,
  appliedPromo = null,
  selPay = "counter";
function toggleStep(n) {
  const s = document.getElementById("step" + n);
  if (!s || s.classList.contains("locked") || s.classList.contains("active"))
    return;
  openStep(n);
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
function setStepDone(n, val) {
  const sv = document.getElementById("sv" + n);
  sv.textContent = val;
  sv.classList.add("filled");
  document.getElementById("sn" + n).textContent = "✓";
  document.getElementById("step" + n).classList.add("done");
}
function confirmStep(n) {
  if (n === 1) {
    if (!selDate) {
      showToast("กรุณาเลือกวันที่");
      return;
    }
    setStepDone(1, fmtDate(selDate));
    document.getElementById("step2").classList.remove("locked");
    openStep(2);
  } else if (n === 2) {
    setStepDone(2, numPpl + " คน");
    selRoom = null;
    selStart = null;
    selEnd = null;
    document.getElementById("step3").classList.remove("locked");
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
    document.getElementById("step4").classList.remove("locked");
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
    if (rangeOverlaps(selStart, selEnd, selRoom, selDate)) {
      showToast("ช่วงเวลานี้ไม่ว่าง");
      return;
    }
    setStepDone(4, slotToTime(selStart) + " – " + slotToTime(selEnd));
    document.getElementById("step5").classList.remove("locked");
    openStep(5);
  }
}
function chgPpl(d) {
  numPpl = Math.max(1, Math.min(20, numPpl + d));
  document.getElementById("pplNum").textContent = numPpl;
}
function renderRoomCards() {
  const el = document.getElementById("roomCards");
  el.innerHTML = "";
  ROOMS.forEach((r) => {
    if (r.cap < numPpl) return;
    const busy = rangeOverlaps(0, TL_SLOTS, r.id, selDate);
    const col = document.createElement("div");
    col.className = "col-6 col-md-4";
    col.innerHTML = `<div class="room-sel-card p-3 h-100${selRoom === r.id ? " rc-selected" : ""}${busy ? " rc-busy" : ""}">
      <div style="font-size:1.4rem;" class="mb-2">${r.emoji}</div>
      <div class="font-kanit fw-bold" style="font-size:.9rem;">${r.name}</div>
      <div class="text-secondary small mb-2">${r.type} · ≤${r.cap} คน</div>
      <div class="font-kanit fw-bold" style="font-size:1.1rem;">฿${r.price.toLocaleString()}<span class="fw-normal text-secondary" style="font-size:.65rem;">/ชม.</span></div>
      ${busy ? '<div class="text-danger" style="font-size:.65rem;margin-top:4px;">ห้องเต็มในวันนี้</div>' : ""}
    </div>`;
    if (!busy)
      col.querySelector(".room-sel-card").onclick = () => {
        selRoom = r.id;
        document
          .querySelectorAll(".room-sel-card")
          .forEach((c) => c.classList.remove("rc-selected"));
        col.querySelector(".room-sel-card").classList.add("rc-selected");
        document.getElementById("confirmStep3").disabled = false;
      };
    el.appendChild(col);
  });
  document.getElementById("confirmStep3").disabled = !selRoom;
}
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
function rangeOverlaps(s1, e1, roomId, date) {
  return getBookings()
    .filter((b) => b.room === roomId && b.date === date)
    .some((b) => {
      const bs = timeToSlot(b.start),
        be = timeToSlot(b.end);
      return s1 < be && e1 > bs;
    });
}
function buildTimeline() {
  const wrap = document.getElementById("tlWrap");
  wrap.innerHTML = "";
  if (!selDate || !selRoom) return;
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
  rows.className = "vstack gap-1";
  const bks = getBookings().filter(
    (b) => b.date === selDate && b.room === selRoom,
  );
  const room = ROOMS.find((r) => r.id === selRoom);
  const row = document.createElement("div");
  row.className = "tl-row";
  const nm = document.createElement("div");
  nm.className = "tl-room-name";
  nm.textContent = room?.name || "";
  row.appendChild(nm);
  const track = document.createElement("div");
  track.className = "tl-track";
  for (let s = 4; s < TL_SLOTS; s += 4) {
    const t = document.createElement("div");
    t.className = "tl-tick";
    t.style.left = (s / TL_SLOTS) * 100 + "%";
    track.appendChild(t);
  }
  bks.forEach((bk) => {
    const bs = timeToSlot(bk.start),
      be = timeToSlot(bk.end);
    const seg = document.createElement("div");
    seg.className = "tl-seg tl-seg-booked";
    seg.style.left = (bs / TL_SLOTS) * 100 + "%";
    seg.style.width = ((be - bs) / TL_SLOTS) * 100 + "%";
    track.appendChild(seg);
  });
  const sd = document.createElement("div");
  sd.className = "tl-selection";
  sd.id = "tlsel-main";
  sd.style.display = "none";
  const sl = document.createElement("div");
  sl.className = "tl-sel-label";
  sd.appendChild(sl);
  track.appendChild(sd);
  const getSlot = (e) => {
    const rect = track.getBoundingClientRect(),
      cx = e.touches ? e.touches[0].clientX : e.clientX;
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
  sd.querySelector(".tl-sel-label").textContent =
    slotToTime(selStart) + " – " + slotToTime(selEnd);
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
function buildReview() {
  const room = ROOMS.find((r) => r.id === selRoom);
  const dur = ((selEnd - selStart) * 15) / 60,
    total = Math.round(room.price * dur);
  document.getElementById("sumDate").textContent = fmtDate(selDate);
  document.getElementById("sumTime").textContent =
    slotToTime(selStart) + " – " + slotToTime(selEnd);
  document.getElementById("sumDur").textContent = dur + " ชั่วโมง";
  document.getElementById("sumPpl").textContent = numPpl + " คน";
  document.getElementById("sumRoom").textContent = room.emoji + " " + room.name;
  appliedPromo = null;
  const pi = document.getElementById("promoInput");
  if (pi) pi.value = "";
  const pm = document.getElementById("promoMsg");
  if (pm) pm.innerHTML = "";
  document.getElementById("discountRow").style.display = "none";
  document.getElementById("sumTotal").textContent =
    "฿" + total.toLocaleString();
  const ca = document.getElementById("cardPayAmt");
  if (ca) ca.textContent = "฿" + total.toLocaleString();
  document.getElementById("sv5").textContent = "฿" + total.toLocaleString();
  document.getElementById("sv5").classList.add("filled");
}
function applyPromo() {
  const code = document.getElementById("promoInput").value.trim().toUpperCase();
  const msg = document.getElementById("promoMsg");
  if (!code) {
    msg.innerHTML = '<span class="text-danger">กรุณาใส่รหัสโปรโมชั่น</span>';
    return;
  }
  const today = new Date().toISOString().split("T")[0];
  const p = getPromos().find(
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
      '<span class="text-danger">รหัสไม่ถูกต้อง หมดอายุ หรือใช้หมดแล้ว</span>';
    refreshTotal();
    return;
  }
  if (p.room && p.room !== selRoom) {
    msg.innerHTML = `<span class="text-danger">โปรโมชั่นนี้ใช้ได้เฉพาะ ${ROOMS.find((r) => r.id === p.room)?.name || p.room}</span>`;
    appliedPromo = null;
    refreshTotal();
    return;
  }
  appliedPromo = p;
  const disc = calcDiscount(p);
  msg.innerHTML = `<span style="color:#2a7a44;">✓ ${p.code} — ${p.desc} (ลด ฿${disc.toLocaleString()})</span>`;
  refreshTotal();
}
function calcDiscount(p) {
  if (!p) return 0;
  const room = ROOMS.find((r) => r.id === selRoom),
    dur = ((selEnd - selStart) * 15) / 60,
    base = Math.round(room.price * dur);
  if (p.type === "percent") return Math.round((base * p.value) / 100);
  if (p.type === "fixed") return Math.min(p.value, base);
  if (p.type === "free_hour")
    return Math.round(room.price * Math.min(p.value, dur));
  return 0;
}
function refreshTotal() {
  const room = ROOMS.find((r) => r.id === selRoom);
  if (!room) return;
  const dur = ((selEnd - selStart) * 15) / 60,
    base = Math.round(room.price * dur),
    disc = appliedPromo ? calcDiscount(appliedPromo) : 0,
    final = Math.max(0, base - disc);
  const dr = document.getElementById("discountRow"),
    de = document.getElementById("sumDiscount");
  if (disc > 0 && dr && de) {
    dr.style.display = "flex";
    de.textContent = "-฿" + disc.toLocaleString();
  } else if (dr) dr.style.display = "none";
  document.getElementById("sumTotal").textContent =
    "฿" + final.toLocaleString();
  const ca = document.getElementById("cardPayAmt");
  if (ca) ca.textContent = "฿" + final.toLocaleString();
}
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
  if (method === "promptpay") {
    const b = document.querySelector(".pay-btn-pp");
    b.textContent = "⏳ กำลังตรวจสอบ...";
    b.disabled = true;
    setTimeout(() => doBook(), 1500);
  } else {
    const num = document.getElementById("cardNum").value.replace(/\s/g, ""),
      name = document.getElementById("cardName").value.trim(),
      exp = document.getElementById("cardExp").value,
      cvv = document.getElementById("cardCvv").value;
    if (num.length < 16 || !name || exp.length < 5 || cvv.length < 3) {
      showToast("กรุณากรอกข้อมูลบัตรให้ครบ");
      return;
    }
    const b = document.querySelector(".pay-btn-card");
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
function doBook() {
  const room = ROOMS.find((r) => r.id === selRoom);
  if (rangeOverlaps(selStart, selEnd, selRoom, selDate)) {
    showToast("ช่วงเวลานี้ไม่ว่างแล้ว");
    return;
  }
  const dur = ((selEnd - selStart) * 15) / 60,
    base = Math.round(room.price * dur),
    disc = appliedPromo ? calcDiscount(appliedPromo) : 0,
    total = Math.max(0, base - disc);
  const code = "NS-" + Math.floor(1000 + Math.random() * 9000);
  const payLabels = {
    counter: "ชำระที่เคาน์เตอร์",
    promptpay: "PromptPay",
    card: "บัตรเครดิต/เดบิต",
  };
  const bk = {
    code,
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
    userEmail: currentUser?.email || "guest",
  };
  const bks = getBookings();
  bks.push(bk);
  saveBookings(bks);
  document.getElementById("mCode").textContent = code;
  document.getElementById("mPayMethod").textContent =
    "ชำระผ่าน: " +
    payLabels[selPay] +
    (disc > 0 ? " · ส่วนลด ฿" + disc.toLocaleString() : "");
  new bootstrap.Modal(document.getElementById("successModal")).show();
}
function fmtDate(iso) {
  const [y, m, d] = iso.split("-");
  return (
    parseInt(d) + " " + MONTHS_TH[parseInt(m) - 1] + " " + (parseInt(y) + 543)
  );
}
