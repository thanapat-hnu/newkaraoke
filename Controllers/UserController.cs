using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models;
using newkaraoke.Models.db;
using newkaraoke.ViewModels;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore.Metadata.Internal;


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

    [HttpPost]
    public IActionResult Login(Register model)
    {
        // เช็คตามกฏจาก View ที่ตั้ง
        if (!ModelState.IsValid)
        {
            return View("Login", model);
        }

        // ทำการตัดช่องว่างหน้าหลัง
        model.Name = model.Name.Trim();
        model.Phone = model.Phone.Trim();
        model.Email = model.Email.Trim().ToLower();
        model.Password = BCrypt.Net.BCrypt.HashPassword(model.Password.Trim());

        // หา email ใน db
        var existingEmail = _db.Users.FirstOrDefault(d => d.Email == model.Email);

        // ถ้าเจอ email ใน db ให้ทำการ ...
        if (existingEmail != null)
        {
            ModelState.AddModelError("Email", "อีเมลถูกใช้งานแล้ว");
            return View("Login", model);
        }

        // if (string.IsNullOrWhiteSpace(model.Phone) || model.Phone.Length != 10 || !model.Phone.All(char.IsDigit))
        // {
        //     ModelState.AddModelError("Phone", "เบอร์โทรต้องเป็นตัวเลข 10 หลักเท่านั้น");
        //     return View("Login", model);
        // }

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

        // ไปที่หน้า Login
        return RedirectToAction("Login");
    }

    public IActionResult Booking()
    {
        return View();
    }

    public IActionResult Profile()
    {
        return View();
    }

    public IActionResult Login()
    {
        return View();
    }

}
