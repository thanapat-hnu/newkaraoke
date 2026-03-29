using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models;
using newkaraoke.Models.db;


namespace newkaraoke.Controllers;

public class IndexController : Controller
{
    private readonly KaraokeDbContext _db;

    public IndexController(KaraokeDbContext db)
    {
        _db = db;
    }

    public IActionResult Index()
    {
        return View();
    }

}
