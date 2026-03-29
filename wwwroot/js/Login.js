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
        joinedAt: "2024-01-01",
      },
    ]);
})();
if (sessionStorage.getItem("ns_user")) location.href = "profile";

function doLogin() {
  const email = document.getElementById("lEmail").value.trim();
  const pass = document.getElementById("lPass").value;
  const u = getUsers().find((u) => u.email === email && u.pass === pass);
  const err = document.getElementById("lErr");
  if (!u) {
    err.classList.remove("d-none");
    return;
  }
  err.classList.add("d-none");
  sessionStorage.setItem("ns_user", JSON.stringify(u));
  location.href =
    new URLSearchParams(location.search).get("return") || "profile";
}
function doRegister() {
  const name = document.getElementById("rName").value.trim();
  const phone = document.getElementById("rPhone").value.trim();
  const birthday = document.getElementById("rBirthday").value;
  const email = document.getElementById("rEmail").value.trim();
  const pass = document.getElementById("rPass").value;
  const err = document.getElementById("rErr");
  if (!name || !phone || !birthday || !email || pass.length < 6) {
    err.textContent = "กรุณากรอกข้อมูลให้ครบ (รหัสผ่านอย่างน้อย 6 ตัว)";
    err.classList.remove("d-none");
    return;
  }
  const users = getUsers();
  if (users.find((u) => u.email === email)) {
    err.textContent = "อีเมลนี้ถูกใช้งานแล้ว";
    err.classList.remove("d-none");
    return;
  }
  err.classList.add("d-none");
  const newUser = {
    name,
    phone,
    birthday,
    email,
    pass,
    joinedAt: new Date().toISOString().split("T")[0],
  };
  users.push(newUser);
  saveUsers(users);
  sessionStorage.setItem("ns_user", JSON.stringify(newUser));
  location.href = "profile";
}
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const active = document.querySelector(".tab-pane.active");
  if (active.id === "loginPane") doLogin();
  else doRegister();
});
