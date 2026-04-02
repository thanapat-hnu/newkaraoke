using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models;
using newkaraoke.Models.db;
using newkaraoke.ViewModels;

namespace newkaraoke.Controllers;

public class ItController : Controller
{
    private readonly KaraokeDbContext _db;


    public ItController(KaraokeDbContext db)
    {
        _db = db;
    }

    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Users()
    {
        return View();
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
