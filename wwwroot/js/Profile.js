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
const MONTHS_S = [
  "ม.ค",
  "ก.พ",
  "มี.ค",
  "เม.ย",
  "พ.ค",
  "มิ.ย",
  "ก.ค",
  "ส.ค",
  "ก.ย",
  "ต.ค",
  "พ.ย",
  "ธ.ค",
];
const PAY = {
  counter: "🏦 เคาน์เตอร์",
  promptpay: "📱 PromptPay",
  card: "💳 บัตร",
};
const ROOMS = [
  { id: "S1", name: "Galaxy S", emoji: "🎤" },
  { id: "M1", name: "Neon M", emoji: "🎵" },
  { id: "M2", name: "Cyber M", emoji: "🎶" },
  { id: "L1", name: "Star L", emoji: "🎸" },
  { id: "L2", name: "Aurora L", emoji: "🎹" },
  { id: "VIP", name: "VIP Galaxy", emoji: "🎺" },
];
// function getBks() {
//   return JSON.parse(localStorage.getItem("ns_bookings") || "[]");
// }
// function getUsers() {
//   return JSON.parse(localStorage.getItem("ns_users") || "[]");
// }
// function saveUsers(u) {
//   localStorage.setItem("ns_users", JSON.stringify(u));
// }
// function showToast(msg) {
//   document.getElementById("toastBody").textContent = msg;
//   new bootstrap.Toast(document.getElementById("liveToast"), {
//     delay: 2500,
//   }).show();
// }

// let ME = JSON.parse(sessionStorage.getItem("ns_user") || "null");
// if (ME) {
//   document.getElementById("notLoggedIn").style.display = "none";
//   document.getElementById("app").style.cssText =
//     "display:block !important;position:relative;z-index:1;";
//   document.getElementById("navR").innerHTML = `
//     <li class="nav-item"><a class="nav-link" href="index">หน้าแรก</a></li>
//     <li class="nav-item"><a class="nav-link" href="booking">จองห้อง</a></li>
//     <li class="nav-item"><span class="nav-link">${ME.name.split(" ")[0]}</span></li>
//     <li class="nav-item ms-md-2"><button class="btn btn-outline-secondary btn-sm px-3" onclick="doLogout()">ออก</button></li>`;
//   initProfile();
// }
// function doLogout() {
//   sessionStorage.removeItem("ns_user");
//   location.href = "index";
// }
// function calcDur(s, e) {
//   const p = (t) => {
//     const [h, m] = t.split(":").map(Number),
//       adj = h < 14 ? h + 24 : h;
//     return adj * 60 + m;
//   };
//   return (p(e) - p(s)) / 60;
// }

// function initProfile() {
//   document.getElementById("avatarLetter").textContent = ME.name
//     .charAt(0)
//     .toUpperCase();
//   document.getElementById("pName").textContent = ME.name;
//   document.getElementById("pEmail").textContent = ME.email;
//   document.getElementById("deleteConfirm").placeholder = ME.email;
//   const bks = getBks().filter(
//     (b) => b.userEmail === ME.email && b.status === "confirmed",
//   );
//   document.getElementById("statTotal").textContent = bks.length;
//   document.getElementById("statHours").textContent = Math.round(
//     bks.reduce((a, b) => a + calcDur(b.start, b.end), 0),
//   );
//   document.getElementById("statSpend").textContent =
//     "฿" + bks.reduce((a, b) => a + b.total, 0).toLocaleString();
//   if (ME.joinedAt) {
//     const d = new Date(ME.joinedAt);
//     document.getElementById("pJoined").textContent =
//       "สมาชิกตั้งแต่ " +
//       MONTHS_TH[d.getMonth()] +
//       " " +
//       (d.getFullYear() + 543);
//   }
//   renderViewMode();
//   renderHistory("");
//   renderActivity();
// }

// function renderViewMode() {
//   document.getElementById("vName").textContent = ME.name;
//   document.getElementById("vEmail").textContent = ME.email;
//   document.getElementById("vPhone").textContent = ME.phone || "—";
//   document.getElementById("vBirthday").textContent = ME.birthday
//     ? (() => {
//         const [y, m, d] = ME.birthday.split("-");
//         return (
//           parseInt(d) +
//           " " +
//           MONTHS_TH[parseInt(m) - 1] +
//           " " +
//           (parseInt(y) + 543)
//         );
//       })()
//     : "—";
// }

// let editOpen = false;
// function toggleEdit() {
//   editOpen = !editOpen;
//   document.getElementById("viewMode").style.display = editOpen
//     ? "none"
//     : "block";
//   const collapse = bootstrap.Collapse.getOrCreateInstance(
//     document.getElementById("editCollapse"),
//   );
//   if (editOpen) {
//     collapse.show();
//     document.getElementById("eName").value = ME.name;
//     document.getElementById("eEmail").value = ME.email;
//     document.getElementById("ePhone").value = ME.phone || "";
//     document.getElementById("eBirthday").value = ME.birthday || "";
//   } else {
//     collapse.hide();
//   }
// }
// function saveProfile() {
//   const name = document.getElementById("eName").value.trim(),
//     email = document.getElementById("eEmail").value.trim();
//   if (!name || !email) {
//     showToast("กรุณากรอกข้อมูลให้ครบ");
//     return;
//   }
//   const users = getUsers(),
//     idx = users.findIndex((u) => u.email === ME.email);
//   const updated = {
//     ...ME,
//     name,
//     email,
//     phone: document.getElementById("ePhone").value.trim(),
//     birthday: document.getElementById("eBirthday").value,
//   };
//   if (idx >= 0) {
//     users[idx] = updated;
//     saveUsers(users);
//   }
//   ME = updated;
//   sessionStorage.setItem("ns_user", JSON.stringify(ME));
//   document.getElementById("pName").textContent = ME.name;
//   document.getElementById("avatarLetter").textContent = ME.name
//     .charAt(0)
//     .toUpperCase();
//   renderViewMode();
//   toggleEdit();
//   showToast("บันทึกข้อมูลแล้ว ✓");
// }
// function changePassword() {
//   const cur = document.getElementById("curPass").value,
//     nw = document.getElementById("newPass").value;
//   const msg = document.getElementById("passMsg");
//   if (!cur || !nw) {
//     msg.innerHTML = '<span class="text-danger">กรุณากรอกข้อมูลให้ครบ</span>';
//     return;
//   }
//   if (ME.pass !== cur) {
//     msg.innerHTML =
//       '<span class="text-danger">รหัสผ่านปัจจุบันไม่ถูกต้อง</span>';
//     return;
//   }
//   if (nw.length < 6) {
//     msg.innerHTML =
//       '<span class="text-danger">รหัสผ่านใหม่ต้องอย่างน้อย 6 ตัว</span>';
//     return;
//   }
//   const users = getUsers(),
//     idx = users.findIndex((u) => u.email === ME.email);
//   if (idx >= 0) {
//     users[idx].pass = nw;
//     saveUsers(users);
//     ME.pass = nw;
//     sessionStorage.setItem("ns_user", JSON.stringify(ME));
//   }
//   document.getElementById("curPass").value = "";
//   document.getElementById("newPass").value = "";
//   msg.innerHTML = '<span style="color:#2a7a44;">✓ เปลี่ยนรหัสผ่านสำเร็จ</span>';
//   setTimeout(() => (msg.innerHTML = ""), 3000);
//   showToast("เปลี่ยนรหัสผ่านแล้ว");
// }
// function deleteAccount() {
//   const input = document.getElementById("deleteConfirm").value.trim();
//   if (input !== ME.email) {
//     showToast("อีเมลไม่ตรงกัน");
//     return;
//   }
//   saveUsers(getUsers().filter((u) => u.email !== ME.email));
//   sessionStorage.removeItem("ns_user");
//   showToast("ลบบัญชีแล้ว");
//   setTimeout(() => (location.href = "index"), 1200);
// }
// function renderHistory(filter) {
//   let bks = getBks().filter((b) => b.userEmail === ME.email);
//   if (filter) bks = bks.filter((b) => b.status === filter);
//   bks.sort((a, b) => b.date.localeCompare(a.date));
//   document.getElementById("histCount").textContent = bks.length + " รายการ";
//   if (!bks.length) {
//     document.getElementById("bkList").innerHTML =
//       `<div class="text-center text-secondary py-5"><strong class="d-block font-kanit mb-1" style="color:var(--ns-ink);">ยังไม่มีการจอง</strong>เริ่มจองห้องคาราโอเกะแรกของคุณได้เลย<br><a href="booking" class="text-dark fw-semibold d-inline-block mt-2">จองเลย →</a></div>`;
//     return;
//   }
//   document.getElementById("bkList").innerHTML =
//     `<div class="vstack gap-px" style="gap:1px;background:var(--ns-border);border:1px solid var(--ns-border);border-radius:4px;overflow:hidden;">` +
//     bks
//       .map((b) => {
//         const [y, mo, d] = b.date.split("-"),
//           dur = calcDur(b.start, b.end);
//         return `<div class="bk-row d-flex align-items-center gap-3 p-3 flex-wrap">
//       <div class="text-center flex-shrink-0" style="width:54px;">
//         <div class="bk-day">${parseInt(d)}</div>
//         <div class="bk-month">${MONTHS_S[parseInt(mo) - 1]} ${(parseInt(y) + 543).toString().slice(2)}</div>
//       </div>
//       <div style="width:1px;height:44px;background:var(--ns-border);flex-shrink:0;"></div>
//       <div class="flex-grow-1">
//         <div class="font-kanit fw-bold" style="font-size:.95rem;">${ROOMS.find((r) => r.id === b.room)?.emoji || ""} ${b.roomName}</div>
//         <div class="text-secondary" style="font-size:.78rem;line-height:1.6;">${b.start} – ${b.end} · ${dur} ชม. · ${b.people} คน · ${PAY[b.payMethod] || "—"}</div>
//         ${b.promoCode ? `<span style="font-size:.7rem;color:#2a7a44;background:rgba(42,122,68,.08);padding:2px 8px;border-radius:2px;">✦ ${b.promoCode}${b.discount ? " (-฿" + b.discount.toLocaleString() + ")" : ""}</span>` : ""}
//       </div>
//       <div class="d-flex flex-column align-items-end gap-1">
//         <div class="font-kanit fw-bold">฿${b.total.toLocaleString()}</div>
//         <span class="badge-ns ${b.status === "confirmed" ? "badge-confirmed" : "badge-pending"}">${b.status === "confirmed" ? "ยืนยันแล้ว" : "รอดำเนินการ"}</span>
//         <div class="font-kanit text-secondary" style="font-size:.6rem;letter-spacing:2px;">${b.code}</div>
//       </div>
//     </div>`;
//       })
//       .join("") +
//     "</div>";
// }
// function renderFavs() {
//   const bks = getBks().filter(
//     (b) => b.userEmail === ME.email && b.status === "confirmed",
//   );
//   const stats = {};
//   bks.forEach((b) => {
//     if (!stats[b.room]) stats[b.room] = { count: 0, total: 0, hrs: 0 };
//     stats[b.room].count++;
//     stats[b.room].total += b.total;
//     stats[b.room].hrs += calcDur(b.start, b.end);
//   });
//   const sorted = ROOMS.map((r) => ({
//     ...r,
//     ...(stats[r.id] || { count: 0, total: 0, hrs: 0 }),
//   }))
//     .filter((r) => r.count > 0)
//     .sort((a, b) => b.count - a.count);
//   if (!sorted.length) {
//     document.getElementById("favGrid").innerHTML =
//       '<div class="col-12 text-center text-secondary py-5"><strong class="d-block font-kanit mb-1" style="color:var(--ns-ink);">ยังไม่มีข้อมูล</strong>เริ่มจองห้องเพื่อดูสถิติ</div>';
//     return;
//   }
//   document.getElementById("favGrid").innerHTML = sorted
//     .map(
//       (r, i) => `
//     <div class="col-6 col-md-4 col-lg-3">
//       <div class="fav-card p-3 h-100">
//         <div class="fav-rank">0${i + 1}</div>
//         <div style="font-size:1.5rem;" class="mb-1">${r.emoji}</div>
//         <div class="font-kanit fw-bold">${r.name}</div>
//         <div class="text-secondary" style="font-size:.75rem;">${r.count} ครั้ง · ${Math.round(r.hrs)} ชม.</div>
//         <div class="font-kanit fw-bold mt-1">฿${r.total.toLocaleString()}</div>
//       </div>
//     </div>`,
//     )
//     .join("");
// }
// function renderActivity() {
//   const bks = getBks().filter((b) => b.userEmail === ME.email);
//   const today = new Date(),
//     months = [];
//   for (let i = 5; i >= 0; i--) {
//     const d = new Date(today);
//     d.setMonth(today.getMonth() - i);
//     months.push({ y: d.getFullYear(), m: d.getMonth() });
//   }
//   const counts = months.map(
//     ({ y, m }) =>
//       bks.filter((b) => {
//         const [by, bm] = b.date.split("-").map(Number);
//         return by === y && bm - 1 === m;
//       }).length,
//   );
//   const mx = Math.max(...counts, 1);
//   document.getElementById("actBar").innerHTML = counts
//     .map(
//       (c, i) =>
//         `<div class="act-col"><div class="act-bar" style="height:${Math.max(4, Math.round((c / mx) * 100))}%;opacity:${(0.2 + (c / mx) * 0.8).toFixed(2)};" title="${MONTHS_S[months[i].m]} — ${c} การจอง"></div></div>`,
//     )
//     .join("");
//   document.getElementById("actLbl").innerHTML = months
//     .map(
//       ({ m }) =>
//         `<div class="act-lbl" style="flex:1;text-align:center;">${MONTHS_S[m]}</div>`,
//     )
//     .join("");
// }
