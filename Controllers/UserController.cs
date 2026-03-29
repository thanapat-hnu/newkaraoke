using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
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

    [HttpPost]
    public IActionResult Register(Register model)
    {

        // var user = new User
        // {
        //     Name = model.Name,
        //     Phone = model.Phone,
        //     Email = model.Email,
        //     Password = model.Password,
        // };
        // _db.Users.Add(user);
        // _db.SaveChanges();
        return View();
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
