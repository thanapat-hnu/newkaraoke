using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models;
using newkaraoke.Models.db;
using newkaraoke.ViewModels;
using Microsoft.AspNetCore.Mvc.Filters;


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


    public IActionResult Promotions()
    {
        return View();
    }

    public IActionResult Logs()
    {
        return View();
    }



}
