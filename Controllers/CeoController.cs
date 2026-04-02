using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models;
using newkaraoke.Models.db;
using newkaraoke.ViewModels;

namespace newkaraoke.Controllers;

public class CeoController : Controller
{
    private readonly KaraokeDbContext _db;


    public CeoController(KaraokeDbContext db)
    {
        _db = db;
    }

    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Revenue()
    {
        return View();
    }

    public IActionResult Rooms()
    {
        return View();
    }

    public IActionResult Heatmap()
    {
        return View();
    }
    public IActionResult Customers()
    {
        return View();
    }



}
