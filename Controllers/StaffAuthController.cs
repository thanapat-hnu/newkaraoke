using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models.db;
using newkaraoke.Services;
using newkaraoke.ViewModels;

namespace newkaraoke.Controllers;

public class StaffAuthController : Controller
{
    private readonly KaraokeDbContext _db;
    private readonly LogService _log;

    public StaffAuthController(KaraokeDbContext db, LogService log)
    {
        _db  = db;
        _log = log;
    }

    public IActionResult Login() => View();

    [HttpPost]
    public IActionResult Login(Users form)
    {
        var user = _db.Users.FirstOrDefault(u => u.Email == form.Email && u.Password == form.Password);

        if (user == null)
        {
            _log.Write("LoginFailed", "User", null,
                $"Login failed: {form.Email}");
            ModelState.AddModelError("", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
            return View(form);
        }

        HttpContext.Session.SetString("UserId",   user.Id.ToString());
        HttpContext.Session.SetString("UserName", user.Name);
        HttpContext.Session.SetString("UserRole", user.Role);

        _log.Write("Login", "User", user.Id,
            $"{user.Name} ({user.Role}) เข้าสู่ระบบ", user.Id);

        return user.Role switch
        {
            "staff" => Redirect("/staff/index"),
            "it"    => Redirect("/it/users"),
            "admin" => Redirect("/ceo/revenue"),
            _       => Redirect("/user/index")
        };
    }

    [HttpPost]
    public IActionResult Logout()
    {
        var name = HttpContext.Session.GetString("UserName");
        var role = HttpContext.Session.GetString("UserRole");
        _log.Write("Logout", "User", null, $"{name} ({role}) ออกจากระบบ");

        HttpContext.Session.Clear();
        return Redirect("/StaffAuth/login");
    }
}
