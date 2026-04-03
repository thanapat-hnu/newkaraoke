using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using newkaraoke.Models.db;
using newkaraoke.ViewModels;

namespace newkaraoke.Controllers;

public class UserController : Controller
{
    private readonly KaraokeDbContext _db;

    public UserController(KaraokeDbContext db)
    {
        _db = db;
    }

    private void SetSession(User user)
    {
        HttpContext.Session.SetString("UserId", user.Id.ToString());
        HttpContext.Session.SetString("UserName", user.Name);
        HttpContext.Session.SetString("UserEmail", user.Email);
        HttpContext.Session.SetString("UserRole", user.Role);
    }

    private bool IsCustomer()
    => HttpContext.Session.GetString("UserRole") == "customer";

    private int GetUserId()
        => int.Parse(HttpContext.Session.GetString("UserId") ?? "0");


    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Auth()
    {
        if (IsCustomer()) return RedirectToAction("Index");
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Register(Users model)
    {
        // เช็คอีเมลซ้ำ
        var email = model.Email.Trim().ToLower();
        if (_db.Users.Any(u => u.Email == email))
        {
            TempData["ActiveTab"] = "register";
            TempData["RegisterError"] = "อีเมลนี้ถูกใช้งานแล้ว";
            return RedirectToAction("Auth");
        }

        var user = new User
        {
            Name = model.Name.Trim(),
            Phone = model.Phone?.Trim(),
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(model.Password),
            Role = "customer",          // ← กำหนด role ให้เสมอ
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _db.Users.Add(user);
        _db.SaveChanges();

        // login เลยหลังสมัคร
        SetSession(user);
        return RedirectToAction("Index");
    }
    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Login(Users model)
    {
        var user = _db.Users.FirstOrDefault(u => u.Email == model.Email.Trim().ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.Password))
        {
            TempData["ActiveTab"] = "login";
            TempData["LoginError"] = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
            return RedirectToAction("Auth");
        }

        // เฉพาะ customer เท่านั้น
        if (user.Role != "customer")
        {
            TempData["ActiveTab"] = "login";
            TempData["LoginError"] = "บัญชีนี้ไม่มีสิทธิ์เข้าใช้งาน";
            return RedirectToAction("Auth");
        }

        SetSession(user);
        return RedirectToAction("Index");
    }

    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Redirect("/user/index");
    }

    public IActionResult Booking()
    {
        return View();
    }

    public IActionResult Profile()
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        var userId = GetUserId();
        var user = _db.Users
            .Include(u => u.Bookings)
                .ThenInclude(b => b.Room)
            .FirstOrDefault(u => u.Id == userId);

        if (user == null) return RedirectToAction("Auth");

        var bookings = user.Bookings
            .Where(b => b.Status == "confirmed")
            .ToList();

        var totalHours = bookings.Sum(b =>
            (b.EndTime - b.StartTime).TotalHours);

        var recent = user.Bookings
            .OrderByDescending(b => b.BookingDate)
            .Take(5)
            .Select(b => new BookingRowDto
            {
                Code = b.BookingCode,
                RoomName = b.Room.RoomName,
                Date = b.BookingDate.ToString("dd/MM/yyyy"),
                Time = $"{b.StartTime:HH:mm} – {b.EndTime:HH:mm}",
                TotalPrice = b.TotalPrice,
                Status = b.Status
            })
            .ToList();

        var vm = new ProfileViewModel
        {
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            JoinedAt = user.CreatedAt?.ToString("MMMM yyyy"),
            TotalBookings = user.Bookings.Count,
            TotalHours = totalHours,
            TotalSpend = bookings.Sum(b => b.TotalPrice),
            RecentBookings = recent
        };

        return View(vm);
    }

    public IActionResult ProfileEdit()
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        var user = _db.Users.Find(GetUserId());
        if (user == null) return RedirectToAction("Auth");

        ViewBag.Phone = user.Phone;
        return View();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult ProfileEditSave(ProfileEditForm form)
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        if (!ModelState.IsValid)
        {
            TempData["EditError"] = "กรุณากรอกข้อมูลให้ถูกต้อง";
            return RedirectToAction("ProfileEdit");
        }

        var user = _db.Users.Find(GetUserId());
        if (user == null) return RedirectToAction("Auth");

        user.Name = form.Name.Trim();
        user.Phone = form.Phone?.Trim();
        user.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        // อัปเดต session ด้วย
        HttpContext.Session.SetString("UserName", user.Name);

        TempData["EditSuccess"] = "บันทึกข้อมูลเรียบร้อยแล้ว";
        return RedirectToAction("ProfileEdit");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult ChangePassword(ChangePasswordForm form)
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        if (!ModelState.IsValid)
        {
            TempData["PassError"] = "กรุณากรอกข้อมูลให้ครบ";
            return RedirectToAction("ProfileEdit");
        }

        var user = _db.Users.Find(GetUserId());
        if (user == null) return RedirectToAction("Auth");

        // เช็ครหัสผ่านเดิม
        if (!BCrypt.Net.BCrypt.Verify(form.CurrentPassword, user.Password))
        {
            TempData["PassError"] = "รหัสผ่านปัจจุบันไม่ถูกต้อง";
            return RedirectToAction("ProfileEdit");
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(form.NewPassword);
        user.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        TempData["PassSuccess"] = "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว";
        return RedirectToAction("ProfileEdit");
    }
}
