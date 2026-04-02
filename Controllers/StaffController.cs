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
            IsActive = r.IsActive,
            ImageUrl = r.ImageUrl,
            ActiveBookings = r.Bookings.Count(b => b.Status == "confirmed")
        })
        .ToList();
        return View(rooms);
    }


    public IActionResult RoomCreate()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> RoomCreate(RoomForm form)
    {
        if (!ModelState.IsValid)
            return View(form);

        string? imagePath = null;

        if (form.Image != null && form.Image.Length > 0)
        {
            var fileName = Guid.NewGuid() + Path.GetExtension(form.Image.FileName);
            var savePath = Path.Combine("wwwroot/images/rooms", fileName);
            Directory.CreateDirectory("wwwroot/images/rooms");

            using var stream = new FileStream(savePath, FileMode.Create);
            await form.Image.CopyToAsync(stream);

            imagePath = "/images/rooms/" + fileName;
        }

        var room = new Room
        {
            RoomName = form.RoomName,
            Size = form.Size,
            PricePerHour = form.PricePerHour,
            ImageUrl = imagePath,
            CreatedBy = int.Parse(HttpContext.Session.GetString("UserId")!),
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _db.Rooms.Add(room);
        _db.SaveChanges();

        return RedirectToAction("RoomManagement");
    }

    // GET /Staff/RoomEdit/5
    public IActionResult RoomEdit(int id)
    {
        var room = _db.Rooms.Find(id);
        if (room == null) return NotFound();

        // ส่งข้อมูลเดิมไปให้ View แสดง
        var form = new RoomForm
        {
            RoomName = room.RoomName,
            Size = room.Size,
            PricePerHour = room.PricePerHour
        };

        ViewBag.RoomId = id;
        ViewBag.CreatedAt = room.CreatedAt?.ToString("dd/MM/yyyy HH:mm");
        ViewBag.UpdatedAt = room.UpdatedAt?.ToString("dd/MM/yyyy HH:mm");

        return View(form);
    }

    // POST /Staff/RoomEdit/5
    [HttpPost]
    public IActionResult RoomEdit(int id, RoomForm form)
    {
        if (!ModelState.IsValid)
        {
            ViewBag.RoomId = id;
            return View(form);
        }

        var room = _db.Rooms.Find(id);
        if (room == null) return NotFound();

        room.RoomName = form.RoomName;
        room.Size = form.Size;
        room.PricePerHour = form.PricePerHour;
        room.UpdatedAt = DateTime.Now;

        _db.SaveChanges();

        return RedirectToAction("RoomManagement");
    }

    [HttpPost]
    public IActionResult ToggleRoom(int id, string roomAction)
    {
        // Console.WriteLine($"id={id}, roomAction={roomAction}");

        var room = _db.Rooms.FirstOrDefault(r => r.Id == id);
        if (room == null)
        {
            return NotFound();
        }
        if (roomAction == "enable")
        {
            room.IsActive = true;
        }
        else
        {
            room.IsActive = false;
        }
        room.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        return RedirectToAction("RoomManagement");
    }
    [HttpPost]
    public IActionResult DeleteRoom(int id)
    {
        var room = _db.Rooms.FirstOrDefault(r => r.Id == id);
        if (room == null)
        {
            return NotFound();
        }
        _db.Rooms.Remove(room);
        _db.SaveChanges();
        return RedirectToAction("RoomManagement");
    }

    public IActionResult Promotions()
    {
        return View();
    }



}
