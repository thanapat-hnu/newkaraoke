// ══ CONSTANTS & HELPERS ═══════════════════════════════════
const INK = "#1C1C1A";
const COLORS = [
  "#1C1C1A",
  "#3A3A36",
  "#6B6B65",
  "#9B9990",
  "#BDBAB2",
  "#DEDAD2",
];
const ROOMS = [
  { id: "S1", name: "Galaxy S", type: "ห้องเล็ก", cap: 4, price: 390 },
  { id: "M1", name: "Neon M", type: "ห้องกลาง", cap: 8, price: 590 },
  { id: "M2", name: "Cyber M", type: "ห้องกลาง", cap: 8, price: 590 },
  { id: "L1", name: "Star L", type: "ห้องใหญ่", cap: 12, price: 890 },
  { id: "L2", name: "Aurora L", type: "ห้องใหญ่", cap: 12, price: 890 },
  { id: "VIP", name: "VIP Galaxy", type: "VIP Suite", cap: 20, price: 1990 },
];
const MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
const DOWS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const PAY = { counter: "เคาน์เตอร์", promptpay: "PromptPay", card: "บัตร" };
const ROLE_SECTIONS = {
  admin: ["dash", "revenue", "rooms", "heatmap", "customers"],
  it: ["users", "promos", "logs"],
  staff: ["bookings", "room-mgmt", "promos"],
};
const ROLE_LABELS = { admin: "Admin", it: "IT", staff: "Staff" };
const SEC_META = {
  dash: { label: "Dashboard", icon: "◈", group: "Analytics" },
  revenue: { label: "รายรับ", icon: "◎", group: "Analytics" },
  rooms: { label: "ห้อง", icon: "◫", group: "Analytics" },
  heatmap: { label: "Heatmap", icon: "▦", group: "Analytics" },
  customers: { label: "ลูกค้า", icon: "◷", group: "Analytics" },
  bookings: { label: "การจอง", icon: "◻", group: "Operations" },
  "room-mgmt": { label: "จัดการห้อง", icon: "⊞", group: "Operations" },
  users: { label: "ผู้ใช้ระบบ", icon: "⊡", group: "Management" },
  promos: { label: "โปรโมชั่น", icon: "✦", group: "Management" },
  logs: { label: "Activity Log", icon: "≡", group: "Management" },
};

let ME = null,
  rangeDays = 7,
  currentSec = "dash",
  activeCharts = {};

function fb(n) {
  return "฿" + Math.round(n).toLocaleString();
}
function fd(iso) {
  const [y, m, d] = iso.split("-");
  return parseInt(d) + " " + MONTHS[parseInt(m) - 1];
}
function dur(s, e) {
  const tm = (t) => {
    const [h, m] = t.split(":").map(Number);
    return (h < 14 ? h + 24 : h) * 60 + m;
  };
  return (tm(e) - tm(s)) / 60;
}
function delt(c, p) {
  if (!p) return '<span class="dn">—</span>';
  const pct = ((c - p) / p) * 100;
  const sg = pct >= 0 ? "+" : "";
  return `<span class="${pct > 0 ? "du" : pct < 0 ? "dd" : "dn"}">${sg}${pct.toFixed(1)}%</span>`;
}
function mkLeg(el, ls, cs, vs) {
  el.innerHTML =
    '<div class="d-flex flex-wrap gap-2">' +
    ls
      .map(
        (l, i) =>
          `<span class="d-flex align-items-center gap-1" style="font-size:.7rem;color:var(--ns-ink3);"><span style="width:9px;height:9px;border-radius:2px;background:${cs[i]};flex-shrink:0;"></span>${l}${vs ? " — " + vs[i] : ""}</span>`,
      )
      .join("") +
    "</div>";
}

// Toast (Bootstrap)
function toast(msg) {
  document.getElementById("toastTxt").textContent = msg;
  new bootstrap.Toast(document.getElementById("liveToast"), {
    delay: 3000,
  }).show();
}

// Modal helpers (Bootstrap Modal API)
function openModal(id) {
  bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).show();
}
function closeModal(id) {
  bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).hide();
}

function mkC(id, cfg) {
  const el = document.getElementById(id);
  if (!el) return null;
  try {
    const c = new Chart(el, cfg);
    activeCharts[id] = c;
    return c;
  } catch (e) {
    return null;
  }
}
function destroyCharts() {
  Object.values(activeCharts).forEach((c) => {
    try {
      c.destroy();
    } catch (e) {}
  });
  activeCharts = {};
}

// ══ AUTH ══════════════════════════════════════════════════
function getAdminUsers() {
  let us = JSON.parse(localStorage.getItem("ns_admin_users") || "[]");
  if (!us.length) {
    us = [
      {
        id: "u1",
        username: "admin",
        pass: "admin123",
        name: "ผู้ดูแล ระบบ",
        email: "admin@neonstar.com",
        role: "admin",
        status: "active",
        createdBy: "system",
      },
      {
        id: "u2",
        username: "it_admin",
        pass: "it123",
        name: "ไอที อัดมิน",
        email: "it@neonstar.com",
        role: "it",
        status: "active",
        createdBy: "system",
      },
      {
        id: "u3",
        username: "staff01",
        pass: "staff123",
        name: "พนักงาน หนึ่ง",
        email: "staff1@neonstar.com",
        role: "staff",
        status: "active",
        createdBy: "it_admin",
      },
      {
        id: "u4",
        username: "staff02",
        pass: "staff456",
        name: "พนักงาน สอง",
        email: "staff2@neonstar.com",
        role: "staff",
        status: "inactive",
        createdBy: "it_admin",
      },
    ];
    localStorage.setItem("ns_admin_users", JSON.stringify(us));
  }
  return us;
}
function saveAdminUsers(u) {
  localStorage.setItem("ns_admin_users", JSON.stringify(u));
}

function doLogin() {
  const u = document.getElementById("aUser").value.trim();
  const p = document.getElementById("aPass").value;
  const found = getAdminUsers().find(
    (x) => x.username === u && x.pass === p && x.status === "active",
  );
  const errEl = document.getElementById("aErr");
  if (!found) {
    errEl.classList.remove("d-none");
    return;
  }
  errEl.classList.add("d-none");
  ME = found;
  document.getElementById("authWrap").style.display = "none";
  document.getElementById("sb").classList.add("show");
  document.getElementById("sbUser").innerHTML =
    `<strong>${ME.name}</strong><br>${ME.email}<br><span style="font-size:.65rem;">${ME.username}</span>`;
  const badge = document.getElementById("sbBadge");
  badge.textContent = ROLE_LABELS[ME.role];
  badge.className = "sb-role-badge role-" + ME.role;
  buildSidebar();
  showSection(ROLE_SECTIONS[ME.role][0]);
  getBks();
  getPromos();
}
function doLogout() {
  ME = null;
  document.getElementById("authWrap").style.display = "flex";
  document.getElementById("sb").classList.remove("show");
  document.getElementById("aUser").value = "";
  document.getElementById("aPass").value = "";
  document.getElementById("aErr").classList.add("d-none");
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !ME) doLogin();
});

// Sidebar
function buildSidebar() {
  const nav = document.getElementById("sbNav");
  nav.innerHTML = "";
  const allowed = ROLE_SECTIONS[ME.role];
  let lastGroup = "";
  Object.entries(SEC_META).forEach(([id, m]) => {
    if (m.group !== lastGroup) {
      const sg = document.createElement("div");
      sg.className = "sb-sec";
      sg.textContent = m.group;
      nav.appendChild(sg);
      lastGroup = m.group;
    }
    const btn = document.createElement("button");
    const canView = allowed.includes(id);
    btn.className = "sb-item" + (canView ? "" : " locked");
    btn.innerHTML = `<span class="sb-icon">${m.icon}</span>${m.label}${canView ? "" : '<span class="sb-lock">🔒</span>'}`;
    if (canView) btn.onclick = () => showSection(id, btn);
    nav.appendChild(btn);
  });
}

function showSection(id, btn) {
  if (!ROLE_SECTIONS[ME.role].includes(id)) return;
  document
    .querySelectorAll(".sec")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("sec-" + id).classList.add("active");
  document
    .querySelectorAll(".sb-item")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.getElementById("topTitle").textContent = SEC_META[id]?.label || id;
  const showDr = ["dash", "revenue", "rooms", "heatmap", "customers"].includes(
    id,
  );
  document.getElementById("drWrap").style.display = showDr ? "flex" : "none";
  currentSec = id;
  destroyCharts();
  renderSection(id);
}
function setRange(d, el) {
  rangeDays = d;
  document
    .querySelectorAll(".dr-btn")
    .forEach((b) => b.classList.remove("active"));
  el.classList.add("active");
  destroyCharts();
  renderSection(currentSec);
}
function renderSection(id) {
  if (id === "dash") renderDash();
  else if (id === "revenue") renderRevenue();
  else if (id === "rooms") renderRooms();
  else if (id === "heatmap") renderHeatmap();
  else if (id === "customers") renderCustomers();
  else if (id === "bookings") renderBookings();
  else if (id === "room-mgmt") renderRoomMgmt();
  else if (id === "users") renderUsers();
  else if (id === "promos") renderPromos();
  else if (id === "logs") renderLogs();
}

// ══ DATA ══════════════════════════════════════════════════
function getBks() {
  let bks = JSON.parse(localStorage.getItem("ns_bookings") || "[]");
  if (bks.length < 15) {
    const seed = [];
    const names = [
      "สมชาย ใจดี",
      "วิไล รัตน์ดา",
      "ธนา สมบูรณ์",
      "มยุรี บุญมา",
      "วิทวัส พรมา",
      "อัญชลี ทอง",
      "ภัทรพล นาค",
      "ณัฐกานต์ แสง",
      "นุชนาถ พิมพ์",
      "สุดารัตน์ ดวง",
      "กิตติ ชาญ",
      "พรทิพย์ รักดี",
      "อานนท์ สุข",
      "รัตนา พิชัย",
      "ธีรพงษ์ นาน",
    ];
    const emails = names.map((_, i) => "user" + i + "@test.com");
    const starts = [
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
      "21:30",
      "22:00",
    ];
    const durs = [1, 1.5, 2, 2.5, 3, 3.5, 4];
    const pays = ["counter", "counter", "promptpay", "card", "promptpay"];
    const today = new Date();
    let idx = 1001;
    for (let da = 60; da >= -7; da--) {
      const d = new Date(today);
      d.setDate(today.getDate() - da);
      const iso = d.toISOString().split("T")[0];
      const dow = d.getDay();
      const n =
        dow === 5 || dow === 6
          ? Math.floor(Math.random() * 6) + 4
          : Math.floor(Math.random() * 4) + 1;
      for (let b = 0; b < n; b++) {
        const r = ROOMS[Math.floor(Math.random() * ROOMS.length)];
        const s = starts[Math.floor(Math.random() * starts.length)];
        const dv = durs[Math.floor(Math.random() * durs.length)];
        const sm = parseInt(s.split(":")[0]) * 60 + parseInt(s.split(":")[1]);
        const em = sm + dv * 60;
        const eh = Math.floor(em / 60) % 24,
          em2 = em % 60;
        const e =
          String(eh).padStart(2, "0") + ":" + String(em2).padStart(2, "0");
        const ni = Math.floor(Math.random() * names.length);
        const people = Math.floor(Math.random() * (r.cap - 1)) + 1;
        const total = Math.round(r.price * dv);
        seed.push({
          code: "NS-" + idx++,
          userEmail: emails[ni],
          userName: names[ni],
          room: r.id,
          roomName: r.name,
          date: iso,
          start: s,
          end: e,
          people,
          total,
          status: Math.random() > 0.12 ? "confirmed" : "pending",
          payMethod: pays[Math.floor(Math.random() * pays.length)],
        });
      }
    }
    localStorage.setItem("ns_bookings", JSON.stringify(seed));
    bks = seed;
  }
  return bks;
}
function saveBks(b) {
  localStorage.setItem("ns_bookings", JSON.stringify(b));
}
function getFiltBks() {
  const bks = getBks();
  if (!rangeDays) return bks;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rangeDays);
  const iso = cutoff.toISOString().split("T")[0];
  return bks.filter((b) => b.date >= iso);
}
function getPrevBks() {
  if (!rangeDays) return [];
  const bks = getBks();
  const e = new Date();
  e.setDate(e.getDate() - rangeDays);
  const s = new Date(e);
  s.setDate(s.getDate() - rangeDays);
  const si = s.toISOString().split("T")[0],
    ei = e.toISOString().split("T")[0];
  return bks.filter((b) => b.date >= si && b.date < ei);
}
function getPromos() {
  let ps = JSON.parse(localStorage.getItem("ns_promos") || "[]");
  if (!ps.length) {
    const today = new Date().toISOString().split("T")[0];
    const fut = new Date();
    fut.setDate(fut.getDate() + 60);
    const futS = fut.toISOString().split("T")[0];
    ps = [
      {
        id: "p1",
        code: "NEON20",
        type: "percent",
        value: 20,
        limit: 100,
        used: 12,
        start: "2025-01-01",
        end: futS,
        desc: "ลด 20% ทุกห้อง",
        room: "",
        status: "active",
        createdBy: "it_admin",
      },
      {
        id: "p2",
        code: "VIPFREE",
        type: "free_hour",
        value: 1,
        limit: 30,
        used: 8,
        start: "2025-01-01",
        end: futS,
        desc: "แถม 1 ชม. สำหรับห้อง VIP",
        room: "VIP",
        status: "active",
        createdBy: "it_admin",
      },
      {
        id: "p3",
        code: "FLAT200",
        type: "fixed",
        value: 200,
        limit: 50,
        used: 50,
        start: "2024-12-01",
        end: "2024-12-31",
        desc: "ลด ฿200 หมดอายุแล้ว",
        room: "",
        status: "inactive",
        createdBy: "it_admin",
      },
    ];
    localStorage.setItem("ns_promos", JSON.stringify(ps));
  }
  return ps;
}
function savePromos(p) {
  localStorage.setItem("ns_promos", JSON.stringify(p));
}

// ══ DASHBOARD ═════════════════════════════════════════════
function renderDash() {
  const bks = getFiltBks(),
    prev = getPrevBks();
  const today = new Date().toISOString().split("T")[0];
  const conf = bks.filter((b) => b.status === "confirmed");
  const rev = conf.reduce((s, b) => s + b.total, 0);
  const prevRev = getPrevBks()
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.total, 0);
  const todayBks = getBks().filter((b) => b.date === today);
  document.getElementById("dashSub").textContent = rangeDays
    ? "ใน " + rangeDays + " วันล่าสุด"
    : "ข้อมูลทั้งหมด";
  document.getElementById("kpiGrid").innerHTML = `
    <div class="kpi"><div class="kpi-lbl">การจองทั้งหมด</div><div class="kpi-val">${bks.length}</div><div class="kpi-d">${delt(bks.length, prev.length)}</div></div>
    <div class="kpi"><div class="kpi-lbl">ยืนยันแล้ว</div><div class="kpi-val">${conf.length}</div><div class="kpi-d">${delt(conf.length, prev.filter((b) => b.status === "confirmed").length)}</div></div>
    <div class="kpi"><div class="kpi-lbl">รายรับ</div><div class="kpi-val" style="font-size:1.2rem;">${fb(rev)}</div><div class="kpi-d">${delt(rev, prevRev)}</div></div>
    <div class="kpi"><div class="kpi-lbl">เฉลี่ย/จอง</div><div class="kpi-val" style="font-size:1.2rem;">${fb(conf.length ? rev / conf.length : 0)}</div><div class="kpi-d"><span class="dn">—</span></div></div>
    <div class="kpi"><div class="kpi-lbl">วันนี้</div><div class="kpi-val">${todayBks.length}</div><div class="kpi-d"><span class="dn">การจอง</span></div></div>
    <div class="kpi"><div class="kpi-lbl">รอดำเนินการ</div><div class="kpi-val">${bks.filter((b) => b.status === "pending").length}</div><div class="kpi-d"><span class="dd">ต้องจัดการ</span></div></div>`;
  const days = rangeDays || 60;
  const dl = [],
    rd = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    dl.push(fd(iso));
    rd.push(
      bks
        .filter((b) => b.date === iso && b.status === "confirmed")
        .reduce((s, b) => s + b.total, 0),
    );
  }
  document.getElementById("revLbl").textContent = "รวม " + fb(rev);
  mkC("cRevDay", {
    type: "bar",
    data: {
      labels: dl,
      datasets: [
        {
          data: rd,
          backgroundColor: INK + "22",
          borderColor: INK,
          borderWidth: 1.5,
          borderRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { autoSkip: true, maxRotation: 0, font: { size: 9 } },
          grid: { display: false },
        },
        y: {
          ticks: {
            callback: (v) => "฿" + v.toLocaleString(),
            font: { size: 9 },
          },
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
        },
      },
    },
  });
  const pc = ROOMS.map((r) => bks.filter((b) => b.room === r.id).length);
  mkC("cRoomPie", {
    type: "doughnut",
    data: {
      labels: ROOMS.map((r) => r.name),
      datasets: [{ data: pc, backgroundColor: COLORS, borderWidth: 0 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: "60%",
    },
  });
  mkLeg(
    document.getElementById("roomPieLg"),
    ROOMS.map((r) => r.name),
    COLORS,
    pc.map((v) => v + " ครั้ง"),
  );
  const dc = [0, 0, 0, 0, 0, 0, 0];
  bks.forEach((b) => {
    dc[new Date(b.date).getDay()]++;
  });
  mkC("cDow", {
    type: "bar",
    data: {
      labels: DOWS,
      datasets: [
        {
          data: dc,
          backgroundColor: dc.map((_, i) =>
            i === 5 || i === 6 ? INK : INK + "44",
          ),
          borderRadius: 3,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
          ticks: { font: { size: 9 } },
        },
      },
    },
  });
  const hc = {};
  for (let h = 14; h <= 25; h++) hc[h % 24] = 0;
  bks.forEach((b) => {
    const h = parseInt(b.start.split(":")[0]);
    if (hc[h] !== undefined) hc[h]++;
  });
  mkC("cPeak", {
    type: "line",
    data: {
      labels: Object.keys(hc).map((h) => String(h).padStart(2, "0") + ":00"),
      datasets: [
        {
          data: Object.values(hc),
          borderColor: INK,
          backgroundColor: INK + "14",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
        y: {
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
          ticks: { font: { size: 9 } },
        },
      },
    },
  });
  const ts = days * 12;
  const ob = document.getElementById("occBars");
  ob.innerHTML = "";
  ROOMS.forEach((r) => {
    const rb = bks.filter((b) => b.room === r.id && b.status === "confirmed");
    const th = rb.reduce((s, b) => s + dur(b.start, b.end), 0);
    const oc = Math.min(100, Math.round((th / ts) * 100));
    ob.innerHTML += `<div class="prog"><div class="prog-hd"><span style="font-size:.78rem;font-weight:600;">${r.name}</span><span style="font-size:.75rem;color:var(--ns-ink3);">${oc}%</span></div><div class="prog-tr"><div class="prog-fl" style="width:${oc}%"></div></div></div>`;
  });
  const rc = getBks()
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  document.getElementById("recentBdy").innerHTML = rc
    .map(
      (b) =>
        `<tr><td><span style="font-family:'Kanit',sans-serif;font-size:.65rem;color:var(--ns-ink3);">${b.code}</span></td><td style="font-size:.8rem;">${b.userName}</td><td style="font-size:.78rem;">${b.roomName}</td><td style="font-family:'Kanit',sans-serif;font-weight:600;font-size:.82rem;">${fb(b.total)}</td><td><span class="tag ${b.status === "confirmed" ? "tag-c" : "tag-p"}">${b.status === "confirmed" ? "ยืนยัน" : "รอ"}</span></td></tr>`,
    )
    .join("");
}

// ══ REVENUE ═══════════════════════════════════════════════
function renderRevenue() {
  const bks = getFiltBks().filter((b) => b.status === "confirmed");
  const prev = getPrevBks().filter((b) => b.status === "confirmed");
  const rev = bks.reduce((s, b) => s + b.total, 0);
  const pRev = prev.reduce((s, b) => s + b.total, 0);
  const avg = bks.length ? rev / bks.length : 0;
  const md = {};
  bks.forEach((b) => {
    md[b.date] = (md[b.date] || 0) + b.total;
  });
  const mx = Math.max(...Object.values(md), 0);
  document.getElementById("revKpi").innerHTML = `
    <div class="kpi"><div class="kpi-lbl">รายรับรวม</div><div class="kpi-val" style="font-size:1.2rem;">${fb(rev)}</div><div class="kpi-d">${delt(rev, pRev)}</div></div>
    <div class="kpi"><div class="kpi-lbl">เฉลี่ย/การจอง</div><div class="kpi-val" style="font-size:1.2rem;">${fb(avg)}</div><div class="kpi-d"><span class="dn">—</span></div></div>
    <div class="kpi"><div class="kpi-lbl">สูงสุด/วัน</div><div class="kpi-val" style="font-size:1.1rem;">${fb(mx)}</div><div class="kpi-d"><span class="dn">—</span></div></div>
    <div class="kpi"><div class="kpi-lbl">จอง (ชำระ)</div><div class="kpi-val">${bks.length}</div><div class="kpi-d">${delt(bks.length, prev.length)}</div></div>`;
  const days = rangeDays || 60;
  const dl = [],
    rd = [],
    cum = [];
  let c = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const v = bks
      .filter((b) => b.date === iso)
      .reduce((s, b) => s + b.total, 0);
    dl.push(fd(iso));
    rd.push(v);
    c += v;
    cum.push(c);
  }
  mkC("cRevTrend", {
    type: "bar",
    data: {
      labels: dl,
      datasets: [
        {
          type: "bar",
          label: "รายวัน",
          data: rd,
          backgroundColor: INK + "22",
          borderColor: INK + "66",
          borderWidth: 1,
          borderRadius: 2,
          yAxisID: "y",
        },
        {
          type: "line",
          label: "สะสม",
          data: cum,
          borderColor: INK,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.3,
          yAxisID: "y2",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { autoSkip: true, maxRotation: 0, font: { size: 9 } },
          grid: { display: false },
        },
        y: {
          position: "left",
          ticks: {
            callback: (v) => "฿" + v.toLocaleString(),
            font: { size: 9 },
          },
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
        },
        y2: {
          position: "right",
          ticks: {
            callback: (v) => "฿" + v.toLocaleString(),
            font: { size: 9 },
          },
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  });
  const rr = ROOMS.map((r) =>
    bks.filter((b) => b.room === r.id).reduce((s, b) => s + b.total, 0),
  );
  mkC("cRevRoom", {
    type: "bar",
    data: {
      labels: ROOMS.map((r) => r.name),
      datasets: [
        {
          data: rr,
          backgroundColor: COLORS,
          borderRadius: 3,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
        y: {
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
          ticks: {
            callback: (v) => "฿" + v.toLocaleString(),
            font: { size: 9 },
          },
        },
      },
    },
  });
  const pays = ["counter", "promptpay", "card"];
  const pr = pays.map((p) =>
    bks
      .filter((b) => b.payMethod === p || (!b.payMethod && p === "counter"))
      .reduce((s, b) => s + b.total, 0),
  );
  const pc = ["#1C1C1A", "#4A4A46", "#9B9990"];
  mkC("cRevPay", {
    type: "doughnut",
    data: {
      labels: pays.map((p) => PAY[p]),
      datasets: [{ data: pr, backgroundColor: pc, borderWidth: 0 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: "60%",
    },
  });
  mkLeg(
    document.getElementById("revPayLg"),
    pays.map((p) => PAY[p]),
    pc,
    pr.map(fb),
  );
  const sr = [...ROOMS].sort((a, b) => {
    const ra = bks
      .filter((x) => x.room === a.id)
      .reduce((s, x) => s + x.total, 0);
    const rb2 = bks
      .filter((x) => x.room === b.id)
      .reduce((s, x) => s + x.total, 0);
    return rb2 - ra;
  });
  const mx2 = Math.max(
    ...sr.map((r) =>
      bks.filter((b) => b.room === r.id).reduce((s, b) => s + b.total, 0),
    ),
    1,
  );
  document.getElementById("topRoomBars").innerHTML = sr
    .map((r) => {
      const v = bks
        .filter((b) => b.room === r.id)
        .reduce((s, b) => s + b.total, 0);
      const pct = Math.round((v / mx2) * 100);
      return `<div class="prog"><div class="prog-hd"><span style="font-size:.8rem;font-weight:600;">${r.name}</span><span style="font-size:.78rem;color:var(--ns-ink3);">${fb(v)}</span></div><div class="prog-tr"><div class="prog-fl" style="width:${pct}%"></div></div></div>`;
    })
    .join("");
}

// ══ ROOMS ANALYTICS ═══════════════════════════════════════
function renderRooms() {
  const bks = getFiltBks();
  const days = rangeDays || 60;
  const ts = days * 12;
  mkC("cRoomBk", {
    type: "bar",
    data: {
      labels: ROOMS.map((r) => r.name),
      datasets: [
        {
          data: ROOMS.map((r) => bks.filter((b) => b.room === r.id).length),
          backgroundColor: COLORS,
          borderRadius: 3,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
        y: {
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
          ticks: { font: { size: 9 } },
        },
      },
    },
  });
  mkC("cRoomRev", {
    type: "bar",
    data: {
      labels: ROOMS.map((r) => r.name),
      datasets: [
        {
          data: ROOMS.map((r) =>
            bks
              .filter((b) => b.room === r.id && b.status === "confirmed")
              .reduce((s, b) => s + b.total, 0),
          ),
          backgroundColor: COLORS,
          borderRadius: 3,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
        y: {
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
          ticks: {
            callback: (v) => "฿" + v.toLocaleString(),
            font: { size: 9 },
          },
        },
      },
    },
  });
  document.getElementById("roomSumBdy").innerHTML = ROOMS.map((r) => {
    const rb = bks.filter((b) => b.room === r.id && b.status === "confirmed");
    const rev = rb.reduce((s, b) => s + b.total, 0),
      th = rb.reduce((s, b) => s + dur(b.start, b.end), 0),
      avg = rb.length ? rev / rb.length : 0,
      oc = Math.min(100, Math.round((th / ts) * 100));
    return `<tr><td style="font-weight:600;">${r.name}</td><td style="font-size:.78rem;color:var(--ns-ink3);">${r.type}</td><td style="font-family:'Kanit',sans-serif;">${rb.length}</td><td style="font-family:'Kanit',sans-serif;font-weight:600;">${fb(rev)}</td><td style="font-family:'Kanit',sans-serif;">${fb(avg)}</td><td>${Math.round(th)} ชม.</td><td><div class="d-flex align-items-center gap-1"><div style="flex:1;height:4px;background:var(--ns-bg3);border-radius:2px;overflow:hidden;min-width:40px;"><div style="height:100%;background:var(--ns-ink);width:${oc}%;"></div></div><span style="font-size:.72rem;">${oc}%</span></div></td></tr>`;
  }).join("");
}

// ══ HEATMAP ═══════════════════════════════════════════════
function renderHeatmap() {
  const bks = getFiltBks();
  const hours = [
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "00",
    "01",
  ];
  const mat = {};
  DOWS.forEach((d) => {
    mat[d] = {};
    hours.forEach((h) => {
      mat[d][h] = 0;
    });
  });
  bks.forEach((b) => {
    const d = DOWS[new Date(b.date).getDay()],
      h = b.start.split(":")[0];
    if (mat[d] && mat[d][h] !== undefined) mat[d][h]++;
  });
  const allV = DOWS.flatMap((d) => hours.map((h) => mat[d][h]));
  const mx = Math.max(...allV) || 1;
  let html =
    '<div style="display:grid;grid-template-columns:32px repeat(' +
    hours.length +
    ',1fr);gap:2px;min-width:460px;">';
  html += "<div></div>";
  hours.forEach(
    (h) =>
      (html += `<div style="font-size:.58rem;color:var(--ns-ink3);text-align:center;padding-bottom:2px;font-family:'Kanit',sans-serif;">${String(h).padStart(2, "0")}</div>`),
  );
  DOWS.forEach((dow) => {
    html += `<div style="font-size:.62rem;color:var(--ns-ink3);display:flex;align-items:center;justify-content:flex-end;padding-right:3px;font-family:'Kanit',sans-serif;">${dow}</div>`;
    hours.forEach((h) => {
      const v = mat[dow][h];
      const op = v ? 0.1 + (v / mx) * 0.85 : 0.04;
      html += `<div onclick="document.getElementById('hmDetail').innerHTML='<strong>${dow} เวลา ${String(h).padStart(2, "0")}:00</strong> — ${v} การจอง'" style="aspect-ratio:1;background:rgba(28,28,26,${op.toFixed(2)});border-radius:2px;cursor:pointer;" title="${dow} ${h}:00 — ${v}"></div>`;
    });
  });
  html += "</div>";
  document.getElementById("hmWrap").innerHTML = html;
  const ha = hours.map(
    (h) => +(DOWS.reduce((s, d) => s + mat[d][h], 0) / 7).toFixed(1),
  );
  mkC("cHourly", {
    type: "line",
    data: {
      labels: hours.map((h) => String(h).padStart(2, "0") + ":00"),
      datasets: [
        {
          data: ha,
          borderColor: INK,
          backgroundColor: INK + "14",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
        y: {
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
          ticks: { font: { size: 9 } },
        },
      },
    },
  });
  const dd = { 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, "3.5+": 0 };
  bks.forEach((b) => {
    const d = dur(b.start, b.end);
    if (d <= 1) dd["1"]++;
    else if (d <= 1.5) dd["1.5"]++;
    else if (d <= 2) dd["2"]++;
    else if (d <= 2.5) dd["2.5"]++;
    else if (d <= 3) dd["3"]++;
    else dd["3.5+"]++;
  });
  mkC("cDurDist", {
    type: "bar",
    data: {
      labels: Object.keys(dd).map((k) => k + " ชม."),
      datasets: [
        {
          data: Object.values(dd),
          backgroundColor: INK + "44",
          borderColor: INK,
          borderWidth: 1.5,
          borderRadius: 3,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
        y: {
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
          ticks: { font: { size: 9 } },
        },
      },
    },
  });
}

// ══ CUSTOMERS ═════════════════════════════════════════════
function renderCustomers() {
  const allBks = getBks(),
    bks = getFiltBks();
  const cm = {};
  allBks.forEach((b) => {
    if (!cm[b.userEmail])
      cm[b.userEmail] = {
        name: b.userName,
        email: b.userEmail,
        bks: [],
        rooms: {},
      };
    cm[b.userEmail].bks.push(b);
    cm[b.userEmail].rooms[b.room] = (cm[b.userEmail].rooms[b.room] || 0) + 1;
  });
  const cs = Object.values(cm);
  const nc = cs.filter((c) => c.bks.length === 1).length,
    rc = cs.length - nc;
  const rev = bks
    .filter((b) => b.status === "confirmed")
    .reduce((s, b) => s + b.total, 0);
  document.getElementById("custKpi").innerHTML = `
    <div class="kpi"><div class="kpi-lbl">ลูกค้าทั้งหมด</div><div class="kpi-val">${cs.length}</div><div class="kpi-d"><span class="dn">รายชื่อ</span></div></div>
    <div class="kpi"><div class="kpi-lbl">ลูกค้าใหม่</div><div class="kpi-val">${nc}</div><div class="kpi-d"><span class="dn">${cs.length ? Math.round((nc / cs.length) * 100) : 0}%</span></div></div>
    <div class="kpi"><div class="kpi-lbl">ลูกค้าประจำ</div><div class="kpi-val">${rc}</div><div class="kpi-d"><span class="dn">${cs.length ? Math.round((rc / cs.length) * 100) : 0}%</span></div></div>
    <div class="kpi"><div class="kpi-lbl">LTV เฉลี่ย</div><div class="kpi-val" style="font-size:1.1rem;">${fb(cs.length ? rev / cs.length : 0)}</div><div class="kpi-d"><span class="dn">ต่อลูกค้า</span></div></div>`;
  mkC("cNewRet", {
    type: "doughnut",
    data: {
      labels: ["ลูกค้าใหม่", "ลูกค้าประจำ"],
      datasets: [
        {
          data: [nc, rc],
          backgroundColor: ["#1C1C1A", "#BDBAB2"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: "60%",
    },
  });
  mkLeg(
    document.getElementById("newRetLg"),
    ["ลูกค้าใหม่", "ลูกค้าประจำ"],
    ["#1C1C1A", "#BDBAB2"],
    [nc + " คน", rc + " คน"],
  );
  const gs = { 1: 0, 2: 0, 3: 0, "4-6": 0, "7-10": 0, "11+": 0 };
  bks.forEach((b) => {
    if (b.people === 1) gs["1"]++;
    else if (b.people === 2) gs["2"]++;
    else if (b.people === 3) gs["3"]++;
    else if (b.people <= 6) gs["4-6"]++;
    else if (b.people <= 10) gs["7-10"]++;
    else gs["11+"]++;
  });
  mkC("cGrpSz", {
    type: "bar",
    data: {
      labels: Object.keys(gs).map((k) => k + " คน"),
      datasets: [
        {
          data: Object.values(gs),
          backgroundColor: INK + "55",
          borderColor: INK,
          borderWidth: 1.5,
          borderRadius: 3,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
        y: {
          grid: { color: "rgba(28,28,26,.06)" },
          border: { display: false },
          ticks: { font: { size: 9 } },
        },
      },
    },
  });
  const top = cs
    .map((c) => {
      const rv = c.bks
        .filter((b) => b.status === "confirmed")
        .reduce((s, b) => s + b.total, 0);
      const fr =
        ROOMS.find(
          (r) =>
            r.id ===
            Object.entries(c.rooms).sort((a, b) => b[1] - a[1])[0]?.[0],
        )?.name || "—";
      return { ...c, rv, fr };
    })
    .sort((a, b) => b.rv - a.rv)
    .slice(0, 10);
  document.getElementById("topCustBdy").innerHTML = top
    .map(
      (c, i) =>
        `<tr><td style="font-family:'Kanit',sans-serif;font-weight:700;color:var(--ns-ink3);">${i + 1}</td><td style="font-weight:600;">${c.name}</td><td style="font-size:.75rem;color:var(--ns-ink3);">${c.email}</td><td style="font-family:'Kanit',sans-serif;">${c.bks.length}</td><td style="font-family:'Kanit',sans-serif;font-weight:700;">${fb(c.rv)}</td><td style="font-family:'Kanit',sans-serif;">${fb(c.bks.length ? c.rv / c.bks.length : 0)}</td><td style="font-size:.8rem;">${c.fr}</td></tr>`,
    )
    .join("");
}

// ══ BOOKINGS ══════════════════════════════════════════════
function renderBookings() {
  const rm = document.getElementById("bkRm");
  if (rm && !rm.innerHTML.includes("Galaxy"))
    ROOMS.forEach((r) => {
      const o = document.createElement("option");
      o.value = r.id;
      o.textContent = r.name;
      rm.appendChild(o);
    });
  renderBkTbl();
}
function renderBkTbl() {
  const q = (document.getElementById("bkQ")?.value || "").toLowerCase();
  const st = document.getElementById("bkSt")?.value || "";
  const rm = document.getElementById("bkRm")?.value || "";
  let bks = getBks();
  if (q)
    bks = bks.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.userName.toLowerCase().includes(q) ||
        b.roomName.toLowerCase().includes(q),
    );
  if (st) bks = bks.filter((b) => b.status === st);
  if (rm) bks = bks.filter((b) => b.room === rm);
  bks.sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById("bkCnt").textContent =
    "แสดง " + Math.min(bks.length, 50) + " / " + bks.length + " รายการ";
  const canEdit = ME && (ME.role === "it" || ME.role === "staff");
  document.getElementById("bkTblBdy").innerHTML = bks
    .slice(0, 50)
    .map(
      (b) => `<tr>
    <td><span style="font-family:'Kanit',sans-serif;font-size:.65rem;color:var(--ns-ink3);">${b.code}</span></td>
    <td><div style="font-weight:600;font-size:.82rem;">${b.userName}</div><div style="font-size:.7rem;color:var(--ns-ink3);">${b.userEmail}</div></td>
    <td style="font-size:.8rem;">${b.roomName}</td>
    <td style="font-size:.78rem;">${fd(b.date)}</td>
    <td style="font-family:'Kanit',sans-serif;font-size:.78rem;">${b.start}–${b.end}</td>
    <td>${b.people}</td>
    <td style="font-family:'Kanit',sans-serif;font-weight:600;font-size:.85rem;">${fb(b.total)}</td>
    <td><span style="font-size:.65rem;padding:2px 6px;border:1px solid var(--ns-border-md);border-radius:2px;color:var(--ns-ink3);">${PAY[b.payMethod] || "เคาน์เตอร์"}</span></td>
    <td><span class="tag ${b.status === "confirmed" ? "tag-c" : "tag-p"}">${b.status === "confirmed" ? "ยืนยัน" : "รอ"}</span></td>
    <td style="white-space:nowrap;">
      ${
        canEdit
          ? `<button class="ab sm" onclick="viewBk('${b.code}')" style="font-size:.62rem;padding:4px 8px;">ดู</button>
      ${b.status === "pending" ? `<button class="ab success" onclick="confirmBk('${b.code}')" style="font-size:.62rem;padding:4px 8px;margin-left:3px;">✓</button>` : ""}
      <button class="ab danger" onclick="cancelBk('${b.code}')" style="font-size:.62rem;padding:4px 8px;margin-left:3px;">✕</button>`
          : "—"
      }
    </td></tr>`,
    )
    .join("");
}
function viewBk(code) {
  const b = getBks().find((x) => x.code === code);
  if (!b) return;
  document.getElementById("modalBkBody").innerHTML = `
    <div class="row g-3 mb-3">
      <div class="col-6"><div style="font-size:.62rem;color:var(--ns-ink3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">รหัสจอง</div><div style="font-family:'Kanit',sans-serif;font-size:1.1rem;font-weight:900;">${b.code}</div></div>
      <div class="col-6"><div style="font-size:.62rem;color:var(--ns-ink3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">สถานะ</div><span class="tag ${b.status === "confirmed" ? "tag-c" : "tag-p"}">${b.status === "confirmed" ? "ยืนยันแล้ว" : "รอดำเนินการ"}</span></div>
      <div class="col-6"><div style="font-size:.62rem;color:var(--ns-ink3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">ลูกค้า</div><div style="font-weight:600;">${b.userName}</div><div style="font-size:.75rem;color:var(--ns-ink3);">${b.userEmail}</div></div>
      <div class="col-6"><div style="font-size:.62rem;color:var(--ns-ink3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">ห้อง</div><div style="font-weight:600;">${b.roomName}</div></div>
      <div class="col-6"><div style="font-size:.62rem;color:var(--ns-ink3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">วันที่</div><div>${fd(b.date)}</div></div>
      <div class="col-6"><div style="font-size:.62rem;color:var(--ns-ink3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">เวลา</div><div style="font-family:'Kanit',sans-serif;font-weight:600;">${b.start} – ${b.end}</div></div>
      <div class="col-6"><div style="font-size:.62rem;color:var(--ns-ink3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">จำนวนคน</div><div>${b.people} คน</div></div>
      <div class="col-6"><div style="font-size:.62rem;color:var(--ns-ink3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">ยอดรวม</div><div style="font-family:'Kanit',sans-serif;font-size:1.1rem;font-weight:900;">${fb(b.total)}</div></div>
    </div>
    <div class="d-flex gap-2 flex-wrap">
      ${b.status === "pending" ? `<button class="ab success" onclick="confirmBk('${b.code}');closeModal('modalBk');renderBkTbl()">✓ ยืนยันการจอง</button>` : ""}
      <button class="ab danger" onclick="cancelBk('${b.code}');closeModal('modalBk')">✕ ยกเลิกการจอง</button>
    </div>`;
  openModal("modalBk");
}
function confirmBk(code) {
  const bks = getBks();
  const i = bks.findIndex((b) => b.code === code);
  if (i >= 0) {
    bks[i].status = "confirmed";
    saveBks(bks);
    writeLog("booking", "ยืนยันการจอง " + code, "✓");
    toast("✓ ยืนยันการจอง " + code);
    renderBkTbl();
  }
}
function cancelBk(code) {
  if (!confirm("ยืนยันการยกเลิก " + code + "?")) return;
  const bk = getBks().find((b) => b.code === code);
  saveBks(getBks().filter((b) => b.code !== code));
  if (bk) writeLog("booking", "ยกเลิกการจอง " + code, "✕");
  toast("ยกเลิกการจอง " + code + " แล้ว");
  renderBkTbl();
}

// ══ USERS ═════════════════════════════════════════════════
function renderUsers() {
  document.getElementById("userBdy").innerHTML = getAdminUsers()
    .map(
      (u) => `<tr>
    <td style="font-family:'Kanit',sans-serif;font-weight:700;">${u.username}</td>
    <td style="font-weight:600;">${u.name}</td>
    <td style="font-size:.78rem;color:var(--ns-ink3);">${u.email}</td>
    <td><span class="role-tag rt-${u.role}">${ROLE_LABELS[u.role]}</span></td>
    <td><span class="tag ${u.status === "active" ? "tag-c" : "tag-p"}">${u.status === "active" ? "Active" : "Inactive"}</span></td>
    <td style="font-size:.75rem;color:var(--ns-ink3);">${u.createdBy}</td>
    <td style="white-space:nowrap;">
      <button class="ab sm" onclick="openUserModal('${u.id}')" style="font-size:.62rem;padding:4px 8px;">แก้ไข</button>
      ${u.username !== "admin" && u.username !== ME.username ? `<button class="ab danger" onclick="deleteUser('${u.id}')" style="font-size:.62rem;padding:4px 8px;margin-left:3px;">ลบ</button>` : ""}
    </td></tr>`,
    )
    .join("");
}
function openUserModal(id) {
  document.getElementById("modalUserTtl").textContent = id
    ? "แก้ไขผู้ใช้"
    : "เพิ่มผู้ใช้";
  document.getElementById("editUserId").value = id || "";
  document.getElementById("uErr").classList.add("d-none");
  if (id) {
    const u = getAdminUsers().find((x) => x.id === id);
    if (!u) return;
    document.getElementById("uUsername").value = u.username;
    document.getElementById("uPass").value = "";
    document.getElementById("uName").value = u.name;
    document.getElementById("uEmail").value = u.email;
    document.getElementById("uRole").value = u.role;
    document.getElementById("uStatus").value = u.status;
  } else {
    ["uUsername", "uPass", "uName", "uEmail"].forEach(
      (id) => (document.getElementById(id).value = ""),
    );
    document.getElementById("uRole").value = "staff";
    document.getElementById("uStatus").value = "active";
  }
  openModal("modalUser");
}
function deleteUser(id) {
  const u = getAdminUsers().find((x) => x.id === id);
  if (!u || !confirm("ลบผู้ใช้ " + u.username + "?")) return;
  saveAdminUsers(getAdminUsers().filter((x) => x.id !== id));
  toast("ลบผู้ใช้ " + u.username + " แล้ว");
  renderUsers();
}
function saveUser() {
  const id = document.getElementById("editUserId").value;
  const username = document.getElementById("uUsername").value.trim();
  const pass = document.getElementById("uPass").value;
  const name = document.getElementById("uName").value.trim();
  const email = document.getElementById("uEmail").value.trim();
  const role = document.getElementById("uRole").value;
  const status = document.getElementById("uStatus").value;
  const err = document.getElementById("uErr");
  if (!username || !name || !email) {
    err.textContent = "กรุณากรอกข้อมูลให้ครบ";
    err.classList.remove("d-none");
    return;
  }
  if (!id && !pass) {
    err.textContent = "กรุณาใส่รหัสผ่าน";
    err.classList.remove("d-none");
    return;
  }
  const users = getAdminUsers();
  if (!id) {
    if (users.find((u) => u.username === username)) {
      err.textContent = "Username นี้มีอยู่แล้ว";
      err.classList.remove("d-none");
      return;
    }
    users.push({
      id: "u" + Date.now(),
      username,
      pass,
      name,
      email,
      role,
      status,
      createdBy: ME.username,
    });
    toast("เพิ่มผู้ใช้ " + username + " แล้ว");
  } else {
    const i = users.findIndex((u) => u.id === id);
    if (i < 0) return;
    users[i] = { ...users[i], name, email, role, status };
    if (pass) users[i].pass = pass;
    toast("อัปเดตผู้ใช้ " + users[i].username + " แล้ว");
  }
  saveAdminUsers(users);
  closeModal("modalUser");
  renderUsers();
}

// ══ PROMOTIONS ════════════════════════════════════════════
function renderPromos() {
  const canEdit = ME && ME.role === "it";
  document.getElementById("promoSub").textContent = canEdit
    ? "สร้าง แก้ไข และจัดการโปรโมชั่น (IT เท่านั้น)"
    : "ดูรายการโปรโมชั่น (สร้างได้เฉพาะ IT)";
  document.getElementById("promoActions").innerHTML = canEdit
    ? `<button class="ab" onclick="openPromoModal()">+ สร้างโปรโมชั่น</button>`
    : '<div class="notice">คุณสามารถดูโปรโมชั่นได้เท่านั้น ไม่สามารถสร้างหรือแก้ไขได้</div>';
  const rm = document.getElementById("pRoom");
  if (rm && !rm.innerHTML.includes("Galaxy"))
    ROOMS.forEach((r) => {
      const o = document.createElement("option");
      o.value = r.id;
      o.textContent = r.name;
      rm.appendChild(o);
    });
  const promos = getPromos();
  const today = new Date().toISOString().split("T")[0];
  const grid = document.getElementById("promoGrid");
  grid.innerHTML =
    promos
      .map((p) => {
        const expired = p.end < today || p.status === "inactive";
        const typeLabel = {
          percent: `ลด ${p.value}%`,
          fixed: `ลด ฿${p.value}`,
          free_hour: `แถม ${p.value} ชม.`,
        }[p.type];
        return `<div class="col-12 col-md-6 col-xl-4"><div class="promo-card" style="${expired ? "opacity:.6" : ""}">
      <span class="promo-status">${expired ? '<span class="tag tag-p">หมดอายุ</span>' : '<span class="tag tag-c">Active</span>'}</span>
      <div class="promo-code">${p.code}</div>
      <div class="promo-desc">${p.desc}${p.room ? " · " + ROOMS.find((r) => r.id === p.room)?.name : ""}</div>
      <div class="promo-footer">
        <div><div class="promo-disc">${typeLabel}</div><div class="promo-meta">${p.used}/${p.limit} ครั้ง · ${fd(p.start)} – ${fd(p.end)}</div><div class="promo-meta mt-1">สร้างโดย: ${p.createdBy}</div></div>
        ${canEdit ? `<div class="d-flex flex-column gap-1"><button class="ab sm" onclick="editPromo('${p.id}')" style="font-size:.62rem;padding:4px 8px;">แก้ไข</button><button class="ab danger" onclick="deletePromo('${p.id}')" style="font-size:.62rem;padding:4px 8px;">ลบ</button></div>` : ""}
      </div>
    </div></div>`;
      })
      .join("") ||
    '<div class="col-12 p-3 text-secondary small">ยังไม่มีโปรโมชั่น</div>';
  const bks = getBks().filter((b) => b.promoCode);
  document.getElementById("promoUseBdy").innerHTML = bks.length
    ? bks
        .slice(0, 10)
        .map(
          (b) =>
            `<tr><td><span style="font-family:'Kanit',sans-serif;font-size:.68rem;">${b.code}</span></td><td>${b.userName}</td><td><span class="pb">${b.promoCode}</span></td><td style="font-family:'Kanit',sans-serif;">${fb(b.discount || 0)}</td><td>${fd(b.date)}</td></tr>`,
        )
        .join("")
    : '<tr><td colspan="5" class="text-center p-4 text-secondary small">ยังไม่มีประวัติการใช้โปรโมชั่น</td></tr>';
}
function openPromoModal(id) {
  document.getElementById("modalPromoTtl").textContent = id
    ? "แก้ไขโปรโมชั่น"
    : "สร้างโปรโมชั่น";
  document.getElementById("editPromoId").value = id || "";
  document.getElementById("pErr").classList.add("d-none");
  if (id) {
    const p = getPromos().find((x) => x.id === id);
    if (!p) return;
    document.getElementById("pCode").value = p.code;
    document.getElementById("pType").value = p.type;
    document.getElementById("pValue").value = p.value;
    document.getElementById("pLimit").value = p.limit;
    document.getElementById("pStart").value = p.start;
    document.getElementById("pEnd").value = p.end;
    document.getElementById("pDesc").value = p.desc;
    document.getElementById("pRoom").value = p.room || "";
    document.getElementById("pStatus").value = p.status;
    togglePromoType();
  } else {
    ["pCode", "pValue", "pLimit", "pDesc"].forEach(
      (i) => (document.getElementById(i).value = ""),
    );
    document.getElementById("pType").value = "percent";
    document.getElementById("pRoom").value = "";
    document.getElementById("pStatus").value = "active";
    const today = new Date().toISOString().split("T")[0];
    const end = new Date();
    end.setDate(end.getDate() + 30);
    document.getElementById("pStart").value = today;
    document.getElementById("pEnd").value = end.toISOString().split("T")[0];
    togglePromoType();
  }
  openModal("modalPromo");
}
function togglePromoType() {
  const t = document.getElementById("pType").value;
  const lbl = {
    percent: "ส่วนลด (%)",
    fixed: "ลด (฿)",
    free_hour: "แถม (ชม.)",
  };
  document.getElementById("pValLbl").textContent = lbl[t] || "ค่า";
}
function editPromo(id) {
  openPromoModal(id);
}
function deletePromo(id) {
  const p = getPromos().find((x) => x.id === id);
  if (!p || !confirm("ลบโปรโมชั่น " + p.code + "?")) return;
  savePromos(getPromos().filter((x) => x.id !== id));
  writeLog("promo", "ลบโปรโมชั่น " + p.code, "🗑");
  toast("ลบโปรโมชั่น " + p.code + " แล้ว");
  renderPromos();
}
function savePromo() {
  const id = document.getElementById("editPromoId").value;
  const code = document.getElementById("pCode").value.trim().toUpperCase();
  const type = document.getElementById("pType").value;
  const value = parseFloat(document.getElementById("pValue").value);
  const limit = parseInt(document.getElementById("pLimit").value);
  const start = document.getElementById("pStart").value;
  const end = document.getElementById("pEnd").value;
  const desc = document.getElementById("pDesc").value.trim();
  const room = document.getElementById("pRoom").value;
  const status = document.getElementById("pStatus").value;
  const err = document.getElementById("pErr");
  if (!code || !value || !limit || !start || !end) {
    err.textContent = "กรุณากรอกข้อมูลให้ครบ";
    err.classList.remove("d-none");
    return;
  }
  const promos = getPromos();
  if (!id) {
    promos.push({
      id: "p" + Date.now(),
      code,
      type,
      value,
      limit,
      used: 0,
      start,
      end,
      desc,
      room,
      status,
      createdBy: ME.username,
    });
    writeLog("promo", "สร้างโปรโมชั่น " + code, "✦");
    toast("สร้างโปรโมชั่น " + code + " แล้ว");
  } else {
    const i = promos.findIndex((x) => x.id === id);
    if (i >= 0) {
      promos[i] = {
        ...promos[i],
        code,
        type,
        value,
        limit,
        start,
        end,
        desc,
        room,
        status,
      };
      writeLog("promo", "แก้ไขโปรโมชั่น " + code, "✏");
      toast("อัปเดตโปรโมชั่น " + code + " แล้ว");
    }
  }
  savePromos(promos);
  closeModal("modalPromo");
  renderPromos();
}

// ══ ROOM MANAGEMENT ═══════════════════════════════════════
function getRooms() {
  let rs = JSON.parse(localStorage.getItem("ns_rooms_custom") || "[]");
  if (!rs.length) {
    rs = ROOMS.map((r) => ({
      ...r,
      emoji: r.emoji || "🎤",
      desc: "",
      status: "active",
    }));
    saveRooms(rs);
  }
  return rs;
}
function saveRooms(rs) {
  localStorage.setItem("ns_rooms_custom", JSON.stringify(rs));
}
function syncRoomsToIndex() {
  const rs = getRooms()
    .filter((r) => r.status === "active")
    .map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      cap: r.cap,
      price: r.price,
      emoji: r.emoji || "🎤",
    }));
  localStorage.setItem("ns_rooms_live", JSON.stringify(rs));
}
function getActiveBkCount(roomId) {
  const today = new Date().toISOString().split("T")[0];
  return getBks().filter(
    (b) => b.room === roomId && b.status === "confirmed" && b.date >= today,
  ).length;
}

(() => {
  const rs = getRooms();
  const emojis = {
    S1: "🎤",
    M1: "🎵",
    M2: "🎶",
    L1: "🎸",
    L2: "🎹",
    VIP: "🎺",
  };
  const descs = {
    S1: 'จอ 55", ไมค์ 2 ตัว, WIFI, JBL',
    M1: 'จอ 75", ไมค์ 4 ตัว, WIFI, Disco Light',
    M2: 'จอ 75", ไมค์ 4 ตัว, WIFI, LED Ceiling',
    L1: 'จอ 85", ไมค์ 6 ตัว, WIFI, Full Sound',
    L2: 'จอ 85", ไมค์ 6 ตัว, WIFI, Mood Light',
    VIP: 'จอ 4K 100", ไมค์ 8 ตัว, ห้องน้ำในตัว, Bar Corner',
  };
  let upd = false;
  rs.forEach((r) => {
    if (!r.emoji && emojis[r.id]) {
      r.emoji = emojis[r.id];
      upd = true;
    }
    if (!r.desc && descs[r.id]) {
      r.desc = descs[r.id];
      upd = true;
    }
    if (!r.status) {
      r.status = "active";
      upd = true;
    }
  });
  if (upd) saveRooms(rs);
})();

function renderRoomMgmt() {
  const rooms = getRooms();
  const grid = document.getElementById("rmGrid");
  const tbody = document.getElementById("rmTableBody");
  grid.innerHTML = "";
  tbody.innerHTML = "";
  rooms.forEach((r) => {
    const activeBks = getActiveBkCount(r.id);
    const isDisabled = r.status === "disabled";
    const isPendingDelete = r.status === "pending-delete";
    const stLabel = isPendingDelete
      ? '<span class="rm-status-badge rm-st-pending">รอลบ</span>'
      : isDisabled
        ? '<span class="rm-status-badge rm-st-disabled">ปิดชั่วคราว</span>'
        : '<span class="rm-status-badge rm-st-active">เปิดอยู่</span>';
    // card (Bootstrap col inside the row grid)
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-lg-4";
    const card = document.createElement("div");
    card.className =
      "rm-card h-100" + (isDisabled || isPendingDelete ? " disabled-room" : "");
    card.innerHTML = `<div class="rm-card-top"><div class="rm-emoji">${r.emoji || "🎤"}</div>${stLabel}</div>
      <div class="rm-name">${r.name}</div>
      <div class="rm-meta">${r.type} · ≤${r.cap} คน<br>${r.desc || ""}</div>
      <div class="rm-price">฿${r.price.toLocaleString()}<span style="font-size:.7rem;font-weight:400;color:var(--ns-ink3);">/ชม.</span></div>
      ${activeBks > 0 ? `<div style="font-size:.7rem;color:var(--ns-amber);margin-top:.25rem;">📅 จองอยู่ ${activeBks} รายการ</div>` : ""}
      <div class="rm-actions">
        <button class="ab sm" onclick="openRoomModal('${r.id}')" style="font-size:.62rem;padding:4px 8px;">แก้ไข</button>
        ${!isDisabled && !isPendingDelete ? `<button class="ab" onclick="toggleRoom('${r.id}','disable')" style="font-size:.62rem;padding:4px 8px;background:rgba(139,96,0,.1);color:var(--ns-amber);border:1px solid rgba(139,96,0,.2);">ปิดชั่วคราว</button>` : ""}
        ${isDisabled ? `<button class="ab success" onclick="toggleRoom('${r.id}','enable')" style="font-size:.62rem;padding:4px 8px;">เปิดใช้งาน</button>` : ""}
        <button class="ab danger" onclick="deleteRoom('${r.id}')" style="font-size:.62rem;padding:4px 8px;">${activeBks > 0 ? "ปิด+ตั้งรอลบ" : "ลบ"}</button>
      </div>`;
    col.appendChild(card);
    grid.appendChild(col);
    tbody.innerHTML += `<tr><td>${r.emoji || "🎤"} <strong>${r.name}</strong></td><td style="font-size:.78rem;color:var(--ns-ink3);">${r.type}</td><td>${r.cap} คน</td><td style="font-family:'Kanit',sans-serif;">฿${r.price.toLocaleString()}</td><td>${activeBks > 0 ? `<span style="color:var(--ns-amber);font-weight:600;">${activeBks} รายการ</span>` : '<span style="color:var(--ns-ink3);">—</span>'}</td><td>${stLabel}</td><td style="white-space:nowrap;"><button class="ab sm" onclick="openRoomModal('${r.id}')" style="font-size:.62rem;padding:4px 8px;">แก้ไข</button><button class="ab danger" onclick="deleteRoom('${r.id}')" style="font-size:.62rem;padding:4px 8px;margin-left:3px;">${activeBks > 0 ? "ปิด+รอลบ" : "ลบ"}</button></td></tr>`;
  });
  // auto-cleanup
  let changed = false;
  const cleaned = getRooms().filter((r) => {
    if (r.status === "pending-delete" && getActiveBkCount(r.id) === 0) {
      writeLog("room", `ลบห้อง ${r.name} อัตโนมัติ`, "🗑");
      changed = true;
      return false;
    }
    return true;
  });
  if (changed) {
    saveRooms(cleaned);
    syncRoomsToIndex();
    renderRoomMgmt();
  }
}
function toggleRoom(id, action) {
  const rooms = getRooms();
  const i = rooms.findIndex((r) => r.id === id);
  if (i < 0) return;
  rooms[i].status = action === "disable" ? "disabled" : "active";
  saveRooms(rooms);
  syncRoomsToIndex();
  writeLog(
    "room",
    `${action === "disable" ? "ปิดชั่วคราว" : "เปิดใช้งาน"}ห้อง ${rooms[i].name}`,
    "🔄",
  );
  toast(`${action === "disable" ? "ปิด" : "เปิด"}ห้อง ${rooms[i].name} แล้ว`);
  renderRoomMgmt();
}
function deleteRoom(id) {
  const rooms = getRooms();
  const r = rooms.find((x) => x.id === id);
  if (!r) return;
  const activeBks = getActiveBkCount(id);
  if (activeBks > 0) {
    if (
      !confirm(
        `ห้อง ${r.name} มีการจอง active ${activeBks} รายการ\nจะตั้งเป็น "รอลบ" และลบอัตโนมัติเมื่อหมดการจอง`,
      )
    )
      return;
    const i = rooms.findIndex((x) => x.id === id);
    rooms[i].status = "pending-delete";
    saveRooms(rooms);
    syncRoomsToIndex();
    writeLog("room", `ตั้งห้อง ${r.name} เป็น "รอลบ"`, "⏳");
    toast(`ตั้ง ${r.name} รอลบแล้ว`);
  } else {
    if (!confirm(`ยืนยันการลบห้อง ${r.name}?`)) return;
    saveRooms(rooms.filter((x) => x.id !== id));
    syncRoomsToIndex();
    writeLog("room", `ลบห้อง ${r.name} แล้ว`, "🗑");
    toast(`ลบห้อง ${r.name} แล้ว`);
  }
  renderRoomMgmt();
}
function openRoomModal(id) {
  document.getElementById("modalRoomTtl").textContent = id
    ? "แก้ไขห้อง"
    : "เพิ่มห้อง";
  document.getElementById("editRoomId").value = id || "";
  document.getElementById("rErr2").classList.add("d-none");
  if (id) {
    const r = getRooms().find((x) => x.id === id);
    if (!r) return;
    document.getElementById("rName").value = r.name;
    document.getElementById("rEmoji").value = r.emoji || "🎤";
    document.getElementById("rType").value = r.type;
    document.getElementById("rCap").value = r.cap;
    document.getElementById("rPrice").value = r.price;
    document.getElementById("rStatus").value =
      r.status === "active" ? "active" : "disabled";
    document.getElementById("rDesc").value = r.desc || "";
  } else {
    ["rName", "rDesc"].forEach((i) => (document.getElementById(i).value = ""));
    document.getElementById("rEmoji").value = "🎤";
    document.getElementById("rType").value = "ห้องกลาง";
    document.getElementById("rCap").value = 8;
    document.getElementById("rPrice").value = 590;
    document.getElementById("rStatus").value = "active";
  }
  openModal("modalRoom");
}
function saveRoom() {
  const id = document.getElementById("editRoomId").value;
  const name = document.getElementById("rName").value.trim();
  const emoji = document.getElementById("rEmoji").value.trim() || "🎤";
  const type = document.getElementById("rType").value;
  const cap = parseInt(document.getElementById("rCap").value);
  const price = parseInt(document.getElementById("rPrice").value);
  const status = document.getElementById("rStatus").value;
  const desc = document.getElementById("rDesc").value.trim();
  const err = document.getElementById("rErr2");
  if (!name || !cap || !price) {
    err.textContent = "กรุณากรอกข้อมูลให้ครบ";
    err.classList.remove("d-none");
    return;
  }
  const rooms = getRooms();
  if (!id) {
    const newId = "R" + Date.now();
    rooms.push({ id: newId, name, emoji, type, cap, price, status, desc });
    writeLog("room", `เพิ่มห้อง ${name}`, "➕");
    toast("เพิ่มห้อง " + name + " แล้ว");
  } else {
    const i = rooms.findIndex((r) => r.id === id);
    if (i < 0) return;
    const old = rooms[i];
    rooms[i] = { ...old, name, emoji, type, cap, price, status, desc };
    writeLog("room", `แก้ไขห้อง ${name}`, "✏");
    toast("อัปเดตห้อง " + name + " แล้ว");
  }
  saveRooms(rooms);
  syncRoomsToIndex();
  closeModal("modalRoom");
  renderRoomMgmt();
}

// ══ ACTIVITY LOG ══════════════════════════════════════════
function getLogs() {
  return JSON.parse(localStorage.getItem("ns_logs") || "[]");
}
function saveLogs(l) {
  localStorage.setItem("ns_logs", JSON.stringify(l));
}
function writeLog(type, msg, icon) {
  const logs = getLogs();
  const ts = new Date().toISOString();
  const user = ME ? ME.username : "system";
  logs.unshift({ ts, type, msg, icon: icon || "·", user });
  if (logs.length > 500) logs.splice(500);
  saveLogs(logs);
}
(() => {
  if (!getLogs().length) {
    const base = new Date();
    const ago = (m) => {
      const d = new Date(base);
      d.setMinutes(d.getMinutes() - m);
      return d.toISOString();
    };
    saveLogs([
      {
        ts: ago(2),
        type: "booking",
        msg: "ยืนยันการจอง NS-1001 (สมชาย ใจดี — Neon M)",
        icon: "✓",
        user: "staff01",
      },
      {
        ts: ago(15),
        type: "promo",
        msg: "สร้างโปรโมชั่น NEON20 ส่วนลด 20%",
        icon: "✦",
        user: "it_admin",
      },
      {
        ts: ago(30),
        type: "booking",
        msg: "ยกเลิกการจอง NS-0998",
        icon: "✕",
        user: "staff01",
      },
      {
        ts: ago(60),
        type: "user",
        msg: "เพิ่มผู้ใช้ staff03 (Role: Staff)",
        icon: "👤",
        user: "it_admin",
      },
      {
        ts: ago(120),
        type: "room",
        msg: "ปิดชั่วคราวห้อง Cyber M เพื่อซ่อมบำรุง",
        icon: "🔄",
        user: "staff01",
      },
      {
        ts: ago(240),
        type: "system",
        msg: "System startup — Admin Panel v2.0",
        icon: "⚙",
        user: "system",
      },
    ]);
  }
})();
function renderLogs() {
  const type = document.getElementById("logTypeFilter")?.value || "";
  const q = (document.getElementById("logSearch")?.value || "").toLowerCase();
  let logs = getLogs();
  if (type) logs = logs.filter((l) => l.type === type);
  if (q)
    logs = logs.filter(
      (l) =>
        l.msg.toLowerCase().includes(q) || l.user.toLowerCase().includes(q),
    );
  document.getElementById("logCount").textContent =
    "แสดง " + logs.length + " รายการ";
  const tagClass = {
    booking: "lt-bk",
    room: "lt-rm",
    user: "lt-usr",
    promo: "lt-promo",
    system: "lt-sys",
  };
  const tagLabel = {
    booking: "จอง",
    room: "ห้อง",
    user: "ผู้ใช้",
    promo: "โปรโม",
    system: "ระบบ",
  };
  document.getElementById("logList").innerHTML = logs.length
    ? logs
        .map((l) => {
          const d = new Date(l.ts);
          const ts = `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
          return `<div class="log-row"><div class="log-time">${ts}</div><div class="log-icon">${l.icon}</div><div class="log-msg">${l.msg} <span style="font-size:.7rem;color:var(--ns-ink3);">· ${l.user}</span></div><span class="log-tag ${tagClass[l.type] || "lt-sys"}">${tagLabel[l.type] || l.type}</span></div>`;
        })
        .join("")
    : '<div class="text-center p-4 text-secondary small">ไม่มีรายการ</div>';
}
function clearLogs() {
  if (!confirm("ล้าง Activity Log ทั้งหมด?")) return;
  saveLogs([]);
  writeLog("system", "ล้าง Activity Log โดย " + ME.username, "⚙");
  renderLogs();
  toast("ล้าง Log แล้ว");
}
