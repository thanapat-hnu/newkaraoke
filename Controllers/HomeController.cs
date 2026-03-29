using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models;
using newkaraoke.Models.db;


namespace newkaraoke.Controllers;

public class HomeController : Controller
{
    private readonly KaraokeDbContext _db;

    public HomeController(KaraokeDbContext db)
    {
        _db = db;
    }

    public IActionResult Index()
    {
        var users = _db.Users.ToList();
        return View(users); // ส่งไปหน้าเว็บ
    }

}
