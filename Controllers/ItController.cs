using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models;
using newkaraoke.Models.db;
using newkaraoke.ViewModels;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;



namespace newkaraoke.Controllers;

public class ItController : Controller
{

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        // ถ้าไม่มี UserId ใน Session → เด้งไป /Auth
        if (HttpContext.Session.GetString("UserRole") != "it")
            context.Result = Redirect("/StaffAuth/login");

        // ถ้ามี → ปล่อยผ่านไป Action ปกติ
        base.OnActionExecuting(context);
    }

    private readonly KaraokeDbContext _db;


    public ItController(KaraokeDbContext db)
    {
        _db = db;
    }

    public IActionResult Index() => RedirectToAction("Users");

    public IActionResult Users()
    {
        var users = _db.Users
            .Where(u => u.Role == "staff" || u.Role == "it" || u.Role == "admin")
            .OrderBy(u => u.Role)
            .ToList();

        return View(users);
    }
    public IActionResult UserCreate()
    {
        return View(new UserForm());
    }

    // POST /IT/UserCreate
    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult UserCreate(UserForm form)
    {
        // Password บังคับตอน Create
        if (string.IsNullOrEmpty(form.Password))
            ModelState.AddModelError("Password", "กรุณากรอกรหัสผ่าน");

        if (!ModelState.IsValid)
            return View(form);

        // เช็คอีเมลซ้ำ
        if (_db.Users.Any(u => u.Email == form.Email))
        {
            ModelState.AddModelError("Email", "อีเมลนี้ถูกใช้งานแล้ว");
            return View(form);
        }

        var user = new User
        {
            Name = form.Name,
            Email = form.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(form.Password), // hash ก่อนบันทึก
            Role = form.Role,
            Phone = form.Phone,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _db.Users.Add(user);
        _db.SaveChanges();

        TempData["Toast"] = $"เพิ่มผู้ใช้ {user.Name} แล้ว";
        return RedirectToAction("Users");
    }

    // GET /IT/UserEdit/5
    public IActionResult UserEdit(int id)
    {
        var user = _db.Users.Find(id);
        if (user == null) return NotFound();

        var form = new UserForm
        {
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            Phone = user.Phone
            // Password ไม่ส่งไป — ไม่แสดงรหัสผ่านเดิม
        };

        ViewBag.UserId = id;
        ViewBag.CreatedAt = user.CreatedAt?.ToString("dd/MM/yyyy HH:mm");

        return View(form);
    }

    // POST /IT/UserEdit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult UserEdit(int id, UserForm form)
    {
        // Password ไม่บังคับตอน Edit
        ModelState.Remove("Password");

        if (!ModelState.IsValid)
        {
            ViewBag.UserId = id;
            return View(form);
        }

        var user = _db.Users.Find(id);
        if (user == null) return NotFound();

        // เช็คอีเมลซ้ำ (ยกเว้นตัวเอง)
        if (_db.Users.Any(u => u.Email == form.Email && u.Id != id))
        {
            ModelState.AddModelError("Email", "อีเมลนี้ถูกใช้งานแล้ว");
            ViewBag.UserId = id;
            return View(form);
        }

        user.Name = form.Name;
        user.Email = form.Email;
        user.Role = form.Role;
        user.Phone = form.Phone;
        user.UpdatedAt = DateTime.Now;

        // เปลี่ยนรหัสผ่านเฉพาะเมื่อกรอกมา
        if (!string.IsNullOrEmpty(form.Password))
            user.Password = BCrypt.Net.BCrypt.HashPassword(form.Password);

        _db.SaveChanges();

        TempData["Toast"] = $"อัปเดตผู้ใช้ {user.Name} แล้ว";
        return RedirectToAction("Users");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult UserDelete(int id)
    {
        var user = _db.Users.Find(id);
        if (user == null) return NotFound();

        // ป้องกันลบตัวเอง
        var currentEmail = User.Identity?.Name;
        if (user.Email == currentEmail)
        {
            TempData["Toast"] = "ไม่สามารถลบบัญชีของตัวเองได้";
            return RedirectToAction("Users");
        }

        _db.Users.Remove(user);
        _db.SaveChanges();

        TempData["Toast"] = $"ลบผู้ใช้ {user.Name} แล้ว";
        return RedirectToAction("Users");
    }


    public IActionResult Promotions(string? filter)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        ViewBag.Filter = filter;

        var query = _db.Promotions
            .Include(p => p.CreatedByNavigation)
            .Include(p => p.Bookings)
                .ThenInclude(b => b.User)
            .AsQueryable();

        query = filter switch
        {
            "active" => query.Where(p => (p.IsActive ?? false) && p.EndDate >= today),
            "inactive" => query.Where(p => !(p.IsActive ?? false)),
            "expired" => query.Where(p => p.EndDate < today),
            _ => query
        };

        return View(query.OrderByDescending(p => p.CreatedAt).ToList());
    }

    public IActionResult PromoCreate() => View(new PromotionForm());

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult PromoCreate(PromotionForm form)
    {
        if (form.EndDate < form.StartDate)
            ModelState.AddModelError("EndDate", "วันหมดอายุต้องหลังวันเริ่ม");

        if (!ModelState.IsValid) return View(form);

        var userId = int.Parse(HttpContext.Session.GetString("UserId") ?? "0");

        var promo = new Promotion
        {
            CreatedBy = userId,
            Name = form.Name,
            Description = form.Description,
            DiscountType = form.DiscountType,
            Value = form.Value,
            Condition = form.Condition,
            StartDate = form.StartDate,
            EndDate = form.EndDate,
            UsageLimit = form.UsageLimit,
            UsedCount = 0,
            IsActive = form.IsActive,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _db.Promotions.Add(promo);
        _db.SaveChanges();

        TempData["Toast"] = $"สร้างโปรโมชั่น {promo.Name} แล้ว";
        return RedirectToAction("Promotions");
    }

    public IActionResult PromoEdit(int id)
    {
        var promo = _db.Promotions
            .Include(p => p.CreatedByNavigation)
            .FirstOrDefault(p => p.Id == id);

        if (promo == null) return NotFound();

        ViewBag.PromoId = id;
        ViewBag.UsedCount = promo.UsedCount ?? 0;
        ViewBag.CreatedBy = promo.CreatedByNavigation.Name;
        ViewBag.CreatedAt = promo.CreatedAt?.ToString("dd/MM/yyyy HH:mm");

        return View(new PromotionForm
        {
            Name = promo.Name,
            Description = promo.Description,
            DiscountType = promo.DiscountType,
            Value = promo.Value,
            Condition = promo.Condition,
            StartDate = promo.StartDate,
            EndDate = promo.EndDate,
            UsageLimit = promo.UsageLimit,
            IsActive = promo.IsActive ?? true
        });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult PromoEdit(int id, PromotionForm form)
    {
        if (form.EndDate < form.StartDate)
            ModelState.AddModelError("EndDate", "วันหมดอายุต้องหลังวันเริ่ม");

        if (!ModelState.IsValid)
        {
            ViewBag.PromoId = id;
            ViewBag.UsedCount = _db.Promotions.Find(id)?.UsedCount ?? 0;
            return View(form);
        }

        var promo = _db.Promotions.Find(id);
        if (promo == null) return NotFound();

        promo.Name = form.Name;
        promo.Description = form.Description;
        promo.DiscountType = form.DiscountType;
        promo.Value = form.Value;
        promo.Condition = form.Condition;
        promo.StartDate = form.StartDate;
        promo.EndDate = form.EndDate;
        promo.UsageLimit = form.UsageLimit;
        promo.IsActive = form.IsActive;
        promo.UpdatedAt = DateTime.Now;

        _db.SaveChanges();

        TempData["Toast"] = $"อัปเดตโปรโมชั่น {promo.Name} แล้ว";
        return RedirectToAction("Promotions");
    }

    // Toggle IsActive
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult PromoToggle(int id)
    {
        var promo = _db.Promotions.Find(id);
        if (promo == null) return NotFound();

        promo.IsActive = !(promo.IsActive ?? false);
        promo.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        var status = (promo.IsActive ?? false) ? "เปิด" : "ปิด";
        TempData["Toast"] = $"{status}โปรโมชั่น {promo.Name} แล้ว";
        return RedirectToAction("Promotions");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult PromoDelete(int id)
    {
        var promo = _db.Promotions
            .Include(p => p.Bookings)
            .FirstOrDefault(p => p.Id == id);

        if (promo == null) return NotFound();

        // ป้องกันลบถ้ามี Booking ใช้อยู่
        if (promo.Bookings.Any())
        {
            TempData["Toast"] = $"ไม่สามารถลบได้ มีการจองที่ใช้โปรโมชั่นนี้อยู่ {promo.Bookings.Count} รายการ";
            return RedirectToAction("Promotions");
        }

        _db.Promotions.Remove(promo);
        _db.SaveChanges();

        TempData["Toast"] = $"ลบโปรโมชั่น {promo.Name} แล้ว";
        return RedirectToAction("Promotions");
    }

    public IActionResult Logs()
    {
        return View();
    }



}
