using System.Diagnostics;
using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using newkaraoke.Models;
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

    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Auth()
    {
        return View();
    }

    [HttpPost]
    public IActionResult Register(Users model)
    {

        // เช็คตามกฏจาก View ที่ตั้ง
        if (!ModelState.IsValid)
        {
            TempData["ActiveTab"] = "register";
            return View("Auth", model);
        }

        // ทำการตัดช่องว่างหน้าหลัง
        model.Name = model.Name.Trim();
        model.Phone = model.Phone?.Trim();
        model.Email = model.Email.Trim().ToLower();
        model.Password = BCrypt.Net.BCrypt.HashPassword(model.Password.Trim());

        // หา email ใน db
        var existingEmail = _db.Users.FirstOrDefault(d => d.Email == model.Email);

        // ถ้าเจอ email ใน db ให้ทำการ ...
        if (existingEmail != null)
        {
            ModelState.AddModelError("Email", "อีเมลถูกใช้งานแล้ว");
            TempData["ActiveTab"] = "register";
            return View("Auth", model);
        }

        // เพิ่มข้อมูลจาก view ไป db.User
        var user = new User
        {
            Name = model.Name,
            Phone = model.Phone,
            Email = model.Email,
            Password = model.Password,
        };

        // เพิ่มข้อมูลลงใน User และ บันทึก
        _db.Users.Add(user);
        _db.SaveChanges();

        // ไปที่หน้า Auth
        TempData["ActiveTab"] = "register";
        return RedirectToAction("Auth");
    }
    [HttpPost]
    public IActionResult Login(Users model)
    {
        var user = _db.Users.FirstOrDefault(u => u.Email == model.Email);

        if (user == null)
        {
            TempData["ActiveTab"] = "login";
            TempData["LoginError"] = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
            return RedirectToAction("Auth");
        }

        bool isCorrect = BCrypt.Net.BCrypt.Verify(model.Password, user.Password);

        if (!isCorrect)
        {
            TempData["ActiveTab"] = "login";
            TempData["LoginError"] = "รหัสผ่านไม่ถูกต้อง";
            return RedirectToAction("Auth");
        }

        HttpContext.Session.SetString("UserId", user.Id.ToString());
        HttpContext.Session.SetString("UserName", user.Name);

        return RedirectToAction("Index", "User");
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
        return View();
    }
}
