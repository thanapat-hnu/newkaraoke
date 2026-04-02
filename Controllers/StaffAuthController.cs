using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models;
using newkaraoke.Models.db;
using newkaraoke.ViewModels;

namespace newkaraoke.Controllers;

public class StaffAuthController : Controller
{
    private readonly KaraokeDbContext _db;

    public StaffAuthController(KaraokeDbContext db)
    {
        _db = db;
    }

    public IActionResult Login()
    {
        return View();
    }

    [HttpPost]
    public IActionResult Login(Users form)
    {
        var user = _db.Users.FirstOrDefault(u => u.Email == form.Email && u.Password == form.Password);

        if (user == null)
        {
            ModelState.AddModelError("", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
            return View(form);
        }

        HttpContext.Session.SetString("UserId", user.Id.ToString());
        HttpContext.Session.SetString("UserName", user.Name);
        HttpContext.Session.SetString("UserRole", user.Role);

        return user.Role switch
        {
            "staff" => Redirect("/staff/index"),
            "it" => Redirect("/it/logs"),
            "admin" => Redirect("/ceo/customers"),
            _ => Redirect("/user/index")
        };
    }

    [HttpPost]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Redirect("/StaffAuth/login");
    }
}
