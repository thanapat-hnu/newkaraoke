using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using newkaraoke.Models;
using newkaraoke.Models.db;
using newkaraoke.ViewModels;
using Microsoft.AspNetCore.Mvc.Filters;

namespace newkaraoke.Controllers;

public class StaffController : Controller
{
    // ก่อน Action ไหนก็ตามจะรัน จะเช็ค Session ก่อนเสมอ
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        // ถ้าไม่มี UserId ใน Session → เด้งไป /Auth
        if (HttpContext.Session.GetString("UserRole") != "staff")
            context.Result = Redirect("/StaffAuth/login");

        // ถ้ามี → ปล่อยผ่านไป Action ปกติ
        base.OnActionExecuting(context);
    }
    private readonly KaraokeDbContext _db;


    public StaffController(KaraokeDbContext db)
    {
        _db = db;
    }

    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Bookings()
    {
        return View();
    }

    public IActionResult RoomManagement()
    {
        var rooms = _db.Rooms.Select(r => new Rooms
        {
            Id = r.Id,
            RoomName = r.RoomName,
            Size = r.Size,
            PricePerHour = r.PricePerHour,
        })
    .ToList();

        return View(rooms);
    }


    public IActionResult RoomCreate()
    {
        return View();
    }

    [HttpPost]
    public IActionResult RoomCreate(RoomForm form)
    {
        if (!ModelState.IsValid)
            return View(form);

        var room = new Room
        {
            RoomName = form.RoomName,
            Size = form.Size,
            PricePerHour = form.PricePerHour,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _db.Rooms.Add(room);
        _db.SaveChanges();

        return RedirectToAction("RoomManagement");
    }

    public IActionResult Promotions()
    {
        return View();
    }



}
