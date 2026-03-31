// function getUsers() {
//   return JSON.parse(localStorage.getItem("ns_users") || "[]");
// }
// function saveUsers(u) {
//   localStorage.setItem("ns_users", JSON.stringify(u));
// }
// (() => {
//   const u = getUsers();
//   if (!u.length)
//     saveUsers([
//       {
//         name: "สมชาย ใจดี",
//         phone: "081-234-5678",
//         email: "demo@demo.com",
//         pass: "demo123",
//         joinedAt: "2024-01-01",
//       },
//     ]);
// })();
// if (sessionStorage.getItem("ns_user")) location.href = "profile";

// function doLogin() {
//   const email = document.getElementById("lEmail").value.trim();
//   const pass = document.getElementById("lPass").value;
//   const u = getUsers().find((u) => u.email === email && u.pass === pass);
//   const err = document.getElementById("lErr");
//   if (!u) {
//     err.classList.remove("d-none");
//     return;
//   }
//   err.classList.add("d-none");
//   sessionStorage.setItem("ns_user", JSON.stringify(u));
//   location.href =
//     new URLSearchParams(location.search).get("return") || "profile";
// }

function doRegister() {
  const name = document.getElementById("Name").value.trim();
  const phone = document.getElementById("Phone").value.trim();
  const email = document.getElementById("Email").value.trim();
  const pass = document.getElementById("Password").value;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;

  // เคลียร์ error ทุกช่องก่อน
  clearErrors();

  let hasError = false;

  if (!name) {
    showFieldError("Name", "กรุณากรอกชื่อ");
    hasError = true;
  }

  if (!phone) {
    showFieldError("Phone", "กรุณากรอกเบอร์โทร");
    hasError = true;
  } else if (!phoneRegex.test(phone)) {
    showFieldError("Phone", "เบอร์โทรต้องเป็นตัวเลข 10 หลัก");
    hasError = true;
  }

  if (!email) {
    showFieldError("Email", "กรุณากรอกอีเมล");
    hasError = true;
  } else if (!emailRegex.test(email)) {
    showFieldError("Email", "รูปแบบอีเมลไม่ถูกต้อง");
    hasError = true;
  }

  if (!pass) {
    showFieldError("Password", "กรุณากรอกรหัสผ่าน");
    hasError = true;
  } else if (pass.length < 6) {
    showFieldError("Password", "รหัสผ่านอย่างน้อย 6 ตัว");
    hasError = true;
  }

  if (hasError) return; // ← ถ้ามี error หยุดเลย!

  document.querySelector("form").submit();
}

function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errEl = document.getElementById(fieldId + "Err");
  input.classList.add("is-invalid"); // ← กรอบแดง!
  errEl.textContent = message;
  errEl.classList.remove("d-none");
}

function clearErrors() {
  ["Name", "Phone", "Email", "Password"].forEach((id) => {
    document.getElementById(id).classList.remove("is-invalid");
    document.getElementById(id + "Err").classList.add("d-none");
  });
}

// ป้องกันไม่ให้พิมพ์อักขระอื่นเลย
document.getElementById("Phone").addEventListener("keypress", (e) => {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault(); // ← บล็อกทันทีตอนพิมพ์!
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  // const active = document.querySelector(".tab-pane.active");

  // if (active.id === "loginPane") doLogin();
  // else doRegister();
});
