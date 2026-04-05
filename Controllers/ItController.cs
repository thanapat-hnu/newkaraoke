using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using newkaraoke.Models.db;
using newkaraoke.Services;
using newkaraoke.ViewModels;

namespace newkaraoke.Controllers;

public class ItController : Controller
{
    private readonly KaraokeDbContext _db;
    private readonly LogService _log;

    public ItController(KaraokeDbContext db, LogService log)
    {
        _db  = db;
        _log = log;
    }

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (HttpContext.Session.GetString("UserRole") != "it")
            context.Result = Redirect("/StaffAuth/login");
        base.OnActionExecuting(context);
    }

    public IActionResult Index() => RedirectToAction("Users");

    // ══ USERS ═════════════════════════════════════════════
    public IActionResult Users(string? role, int page = 1)
    {
        const int pageSize = 20;
        var query = _db.Users.AsQueryable();
        if (!string.IsNullOrEmpty(role)) query = query.Where(u => u.Role == role);

        var total = query.Count();
        var users = query.OrderBy(u => u.Role).ThenBy(u => u.Name)
                         .Skip((page - 1) * pageSize).Take(pageSize).ToList();

        ViewBag.RoleFilter = role;
        ViewBag.Page       = page;
        ViewBag.TotalPages = (int)Math.Ceiling(total / (double)pageSize);
        ViewBag.Total      = total;
        return View(users);
    }

    public IActionResult UserCreate() => View(new UserForm());

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult UserCreate(UserForm form)
    {
        if (string.IsNullOrEmpty(form.Password))
            ModelState.AddModelError("Password", "กรุณากรอกรหัสผ่าน");
        if (!ModelState.IsValid) return View(form);

        if (_db.Users.Any(u => u.Email == form.Email))
        {
            ModelState.AddModelError("Email", "อีเมลนี้ถูกใช้งานแล้ว");
            return View(form);
        }

        var user = new User
        {
            Name      = form.Name,
            Email     = form.Email,
            Password  = BCrypt.Net.BCrypt.HashPassword(form.Password),
            Role      = form.Role,
            Phone     = form.Phone,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };
        _db.Users.Add(user);
        _db.SaveChanges();

        _log.Write("UserCreate", "User", user.Id,
            $"เพิ่มผู้ใช้ '{user.Name}' ({user.Email}) Role: {user.Role}");

        TempData["Toast"] = $"เพิ่มผู้ใช้ {user.Name} แล้ว";
        return RedirectToAction("Users");
    }

    public IActionResult UserEdit(int id)
    {
        var user = _db.Users.Find(id);
        if (user == null) return NotFound();
        ViewBag.UserId    = id;
        ViewBag.CreatedAt = user.CreatedAt?.ToString("dd/MM/yyyy HH:mm");
        return View(new UserForm { Name = user.Name, Email = user.Email, Role = user.Role, Phone = user.Phone });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult UserEdit(int id, UserForm form)
    {
        ModelState.Remove("Password");
        if (!ModelState.IsValid) { ViewBag.UserId = id; return View(form); }

        if (_db.Users.Any(u => u.Email == form.Email && u.Id != id))
        {
            ModelState.AddModelError("Email", "อีเมลนี้ถูกใช้งานแล้ว");
            ViewBag.UserId = id;
            return View(form);
        }

        var user = _db.Users.Find(id);
        if (user == null) return NotFound();

        var changes = new List<string>();
        if (user.Name  != form.Name)  changes.Add($"ชื่อ: {user.Name} → {form.Name}");
        if (user.Email != form.Email) changes.Add($"Email: {user.Email} → {form.Email}");
        if (user.Role  != form.Role)  changes.Add($"Role: {user.Role} → {form.Role}");
        if (!string.IsNullOrEmpty(form.Password)) changes.Add("เปลี่ยนรหัสผ่าน");

        user.Name      = form.Name;
        user.Email     = form.Email;
        user.Role      = form.Role;
        user.Phone     = form.Phone;
        user.UpdatedAt = DateTime.Now;
        if (!string.IsNullOrEmpty(form.Password))
            user.Password = BCrypt.Net.BCrypt.HashPassword(form.Password);
        _db.SaveChanges();

        _log.Write("UserEdit", "User", id,
            $"แก้ไขผู้ใช้ '{user.Name}': {string.Join(", ", changes)}");

        TempData["Toast"] = $"อัปเดตผู้ใช้ {user.Name} แล้ว";
        return RedirectToAction("Users");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult UserDelete(int id)
    {
        var user = _db.Users.Find(id);
        if (user == null) return NotFound();

        _log.Write("UserDelete", "User", id,
            $"ลบผู้ใช้ '{user.Name}' ({user.Email}) Role: {user.Role}");

        _db.Users.Remove(user);
        _db.SaveChanges();

        TempData["Toast"] = $"ลบผู้ใช้ {user.Name} แล้ว";
        return RedirectToAction("Users");
    }

    // ══ PROMOTIONS ════════════════════════════════════════
    public IActionResult Promotions(string? filter)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        ViewBag.Filter = filter;
        var query = _db.Promotions.Include(p => p.CreatedByNavigation).AsQueryable();
        query = filter switch
        {
            "active"   => query.Where(p => (p.IsActive ?? false) && p.EndDate >= today),
            "inactive" => query.Where(p => !(p.IsActive ?? false)),
            "expired"  => query.Where(p => p.EndDate < today),
            _          => query
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
        var promo  = new Promotion
        {
            CreatedBy    = userId,
            Name         = form.Name,
            Description  = form.Description,
            DiscountType = form.DiscountType,
            Value        = form.Value,
            Condition    = form.Condition,
            StartDate    = form.StartDate,
            EndDate      = form.EndDate,
            UsageLimit   = form.UsageLimit,
            UsedCount    = 0,
            IsActive     = form.IsActive,
            CreatedAt    = DateTime.Now,
            UpdatedAt    = DateTime.Now
        };
        _db.Promotions.Add(promo);
        _db.SaveChanges();

        _log.Write("PromoCreate", "Promotion", promo.Id,
            $"สร้างโปรโมชั่น '{promo.Name}' ลด {promo.DiscountType} {promo.Value} หมดอายุ {promo.EndDate:dd/MM/yyyy}");

        TempData["Toast"] = $"สร้างโปรโมชั่น {promo.Name} แล้ว";
        return RedirectToAction("Promotions");
    }

    public IActionResult PromoEdit(int id)
    {
        var promo = _db.Promotions.Include(p => p.CreatedByNavigation).FirstOrDefault(p => p.Id == id);
        if (promo == null) return NotFound();
        ViewBag.PromoId   = id;
        ViewBag.UsedCount = promo.UsedCount ?? 0;
        ViewBag.CreatedBy = promo.CreatedByNavigation.Name;
        ViewBag.CreatedAt = promo.CreatedAt?.ToString("dd/MM/yyyy HH:mm");
        return View(new PromotionForm
        {
            Name = promo.Name, Description = promo.Description,
            DiscountType = promo.DiscountType, Value = promo.Value,
            Condition = promo.Condition, StartDate = promo.StartDate,
            EndDate = promo.EndDate, UsageLimit = promo.UsageLimit,
            IsActive = promo.IsActive ?? true
        });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult PromoEdit(int id, PromotionForm form)
    {
        if (form.EndDate < form.StartDate)
            ModelState.AddModelError("EndDate", "วันหมดอายุต้องหลังวันเริ่ม");
        if (!ModelState.IsValid) { ViewBag.PromoId = id; ViewBag.UsedCount = _db.Promotions.Find(id)?.UsedCount ?? 0; return View(form); }

        var promo = _db.Promotions.Find(id);
        if (promo == null) return NotFound();

        var changes = new List<string>();
        if (promo.Name        != form.Name)        changes.Add($"ชื่อ: {promo.Name} → {form.Name}");
        if (promo.DiscountType!= form.DiscountType) changes.Add($"ประเภท: {promo.DiscountType} → {form.DiscountType}");
        if (promo.Value       != form.Value)       changes.Add($"ค่า: {promo.Value} → {form.Value}");
        if (promo.IsActive    != form.IsActive)    changes.Add($"สถานะ: {(promo.IsActive==true?"เปิด":"ปิด")} → {(form.IsActive?"เปิด":"ปิด")}");

        promo.Name = form.Name; promo.Description = form.Description;
        promo.DiscountType = form.DiscountType; promo.Value = form.Value;
        promo.Condition = form.Condition; promo.StartDate = form.StartDate;
        promo.EndDate = form.EndDate; promo.UsageLimit = form.UsageLimit;
        promo.IsActive = form.IsActive; promo.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        _log.Write("PromoEdit", "Promotion", id,
            $"แก้ไขโปรโมชั่น '{promo.Name}': {string.Join(", ", changes)}");

        TempData["Toast"] = $"อัปเดตโปรโมชั่น {promo.Name} แล้ว";
        return RedirectToAction("Promotions");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult PromoToggle(int id)
    {
        var promo = _db.Promotions.Find(id);
        if (promo == null) return NotFound();

        promo.IsActive  = !(promo.IsActive ?? false);
        promo.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        var status = (promo.IsActive ?? false) ? "เปิด" : "ปิด";
        _log.Write("PromoToggle", "Promotion", id,
            $"{status}โปรโมชั่น '{promo.Name}'");

        TempData["Toast"] = $"{status}โปรโมชั่น {promo.Name} แล้ว";
        return RedirectToAction("Promotions");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult PromoDelete(int id)
    {
        var promo = _db.Promotions.Include(p => p.Bookings).FirstOrDefault(p => p.Id == id);
        if (promo == null) return NotFound();

        if (promo.Bookings.Any())
        {
            TempData["Toast"] = $"ไม่สามารถลบได้ มีการจองที่ใช้โปรโมชั่นนี้อยู่ {promo.Bookings.Count} รายการ";
            return RedirectToAction("Promotions");
        }

        _log.Write("PromoDelete", "Promotion", id,
            $"ลบโปรโมชั่น '{promo.Name}'");

        _db.Promotions.Remove(promo);
        _db.SaveChanges();

        TempData["Toast"] = $"ลบโปรโมชั่น {promo.Name} แล้ว";
        return RedirectToAction("Promotions");
    }

    // ══ LOGS ══════════════════════════════════════════════
    public IActionResult Logs(string? actionFilter, string? entity, int page = 1)
    {
        const int pageSize = 50;
        var query = _db.Logs.Include(l => l.User).AsQueryable();

        if (!string.IsNullOrEmpty(actionFilter)) query = query.Where(l => l.Action == actionFilter);
        if (!string.IsNullOrEmpty(entity))       query = query.Where(l => l.Entity == entity);

        var total = query.Count();
        var logs  = query.OrderByDescending(l => l.CreatedAt)
                         .Skip((page - 1) * pageSize).Take(pageSize).ToList();

        ViewBag.Actions      = _db.Logs.Select(l => l.Action).Distinct().OrderBy(x => x).ToList();
        ViewBag.Entities     = _db.Logs.Where(l => l.Entity != null).Select(l => l.Entity!).Distinct().OrderBy(x => x).ToList();
        ViewBag.ActionFilter = actionFilter;
        ViewBag.EntityFilter = entity;
        ViewBag.Total        = total;
        ViewBag.Page         = page;
        ViewBag.TotalPages   = (int)Math.Ceiling(total / (double)pageSize);

        return View(logs);
    }
}
