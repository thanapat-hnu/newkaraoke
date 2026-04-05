using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using newkaraoke.Models.db;
using newkaraoke.Services;
using newkaraoke.ViewModels;

namespace newkaraoke.Controllers;

public class StaffController : Controller
{
    private readonly KaraokeDbContext _db;
    private readonly LogService _log;

    public StaffController(KaraokeDbContext db, LogService log)
    {
        _db  = db;
        _log = log;
    }

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (HttpContext.Session.GetString("UserRole") != "staff")
            context.Result = Redirect("/StaffAuth/login");
        base.OnActionExecuting(context);
    }

    private int GetUserId() =>
        int.TryParse(HttpContext.Session.GetString("UserId"), out var id) ? id : 0;

    // ══ DASHBOARD ════════════════════════════════════════
    public IActionResult Index() => View();

    // ══ BOOKINGS ══════════════════════════════════════════
    public IActionResult Bookings(string? q, string? status, int? roomId, int page = 1)
    {
        const int pageSize = 30;

        var query = _db.Bookings.Include(b => b.User).Include(b => b.Room).AsQueryable();

        if (!string.IsNullOrEmpty(q))
        {
            var qLow = q.ToLower();
            query = query.Where(b =>
                b.BookingCode.ToLower().Contains(qLow) ||
                b.User.Name.ToLower().Contains(qLow) ||
                b.Room.RoomName.ToLower().Contains(qLow));
        }
        if (!string.IsNullOrEmpty(status)) query = query.Where(b => b.Status == status);
        if (roomId.HasValue)               query = query.Where(b => b.RoomId == roomId.Value);

        var total    = query.Count();
        var bookings = query
            .OrderByDescending(b => b.BookingDate).ThenByDescending(b => b.StartTime)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(b => new StaffBookingRow
            {
                Code        = b.BookingCode,
                UserName    = b.User.Name,
                UserEmail   = b.User.Email,
                RoomName    = b.Room.RoomName,
                DateDisplay = b.BookingDate.ToString("dd/MM/yyyy"),
                StartTime   = b.StartTime.ToString("HH:mm"),
                EndTime     = b.EndTime.ToString("HH:mm"),
                Total       = b.TotalPrice,
                Status      = b.Status ?? ""
            }).ToList();

        var rooms = _db.Rooms.OrderBy(r => r.RoomName)
            .Select(r => new { r.Id, r.RoomName }).ToList();

        ViewBag.Rooms        = rooms;
        ViewBag.SearchQuery  = q;
        ViewBag.StatusFilter = status;
        ViewBag.RoomFilter   = roomId?.ToString();
        ViewBag.TotalCount   = total;
        ViewBag.Page         = page;
        ViewBag.TotalPages   = (int)Math.Ceiling(total / (double)pageSize);

        return View(bookings);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult ConfirmBooking(string code)
    {
        var b = _db.Bookings.Include(x => x.Room).Include(x => x.User)
                            .FirstOrDefault(x => x.BookingCode == code);
        if (b == null) return NotFound();

        b.Status    = "confirmed";
        b.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        _log.Write("BookingConfirm", "Booking", b.Id,
            $"ยืนยันการจอง {code} — {b.User.Name} ห้อง {b.Room.RoomName} วันที่ {b.BookingDate:dd/MM/yyyy}");

        TempData["Toast"] = $"ยืนยันการจอง {code} แล้ว";
        return RedirectToAction("Bookings");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CancelBooking(string code)
    {
        var b = _db.Bookings.Include(x => x.Room).Include(x => x.User)
                            .FirstOrDefault(x => x.BookingCode == code);
        if (b == null) return NotFound();

        b.Status    = "cancelled";
        b.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        _log.Write("BookingCancel", "Booking", b.Id,
            $"ยกเลิกการจอง {code} — {b.User.Name} ห้อง {b.Room.RoomName} วันที่ {b.BookingDate:dd/MM/yyyy}");

        TempData["Toast"] = $"ยกเลิกการจอง {code} แล้ว";
        return RedirectToAction("Bookings");
    }

    public IActionResult BookingDetail(string code)
    {
        var b = _db.Bookings.Include(x => x.User).Include(x => x.Room).Include(x => x.Promotion)
                            .FirstOrDefault(x => x.BookingCode == code);
        if (b == null) return NotFound();
        return Json(new {
            code   = b.BookingCode, user  = b.User.Name, room  = b.Room.RoomName,
            date   = b.BookingDate.ToString("dd/MM/yyyy"),
            time   = $"{b.StartTime:HH:mm} – {b.EndTime:HH:mm}",
            total  = b.TotalPrice, status = b.Status, promo = b.Promotion?.Name ?? "—"
        });
    }

    // ══ ROOMS ═════════════════════════════════════════════
    public IActionResult RoomManagement()
    {
        var rooms = _db.Rooms.Select(r => new Rooms
        {
            Id             = r.Id,
            RoomName       = r.RoomName,
            Size           = r.Size,
            PricePerHour   = r.PricePerHour,
            IsActive       = r.IsActive,
            ImageUrl       = r.ImageUrl,
            ActiveBookings = r.Bookings.Count(b => b.Status == "confirmed")
        }).ToList();
        return View(rooms);
    }

    public IActionResult RoomCreate() => View();

    [HttpPost]
    public async Task<IActionResult> RoomCreate(RoomForm form)
    {
        if (!ModelState.IsValid) return View(form);

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
            RoomName     = form.RoomName,
            Size         = form.Size,
            PricePerHour = form.PricePerHour,
            ImageUrl     = imagePath,
            CreatedBy    = GetUserId(),
            CreatedAt    = DateTime.Now,
            UpdatedAt    = DateTime.Now
        };
        _db.Rooms.Add(room);
        _db.SaveChanges();

        _log.Write("RoomCreate", "Room", room.Id,
            $"เพิ่มห้อง '{room.RoomName}' ขนาด {room.Size} คน ราคา {room.PricePerHour}/ชม.");

        return RedirectToAction("RoomManagement");
    }

    public IActionResult RoomEdit(int id)
    {
        var room = _db.Rooms.Find(id);
        if (room == null) return NotFound();
        ViewBag.RoomId    = id;
        ViewBag.CreatedAt = room.CreatedAt?.ToString("dd/MM/yyyy HH:mm");
        ViewBag.UpdatedAt = room.UpdatedAt?.ToString("dd/MM/yyyy HH:mm");
        return View(new RoomForm { RoomName = room.RoomName, Size = room.Size, PricePerHour = room.PricePerHour });
    }

    [HttpPost]
    public IActionResult RoomEdit(int id, RoomForm form)
    {
        if (!ModelState.IsValid) { ViewBag.RoomId = id; return View(form); }

        var room = _db.Rooms.Find(id);
        if (room == null) return NotFound();

        var old = $"{room.RoomName} / {room.Size} คน / {room.PricePerHour}/ชม.";
        room.RoomName     = form.RoomName;
        room.Size         = form.Size;
        room.PricePerHour = form.PricePerHour;
        room.UpdatedAt    = DateTime.Now;
        _db.SaveChanges();

        _log.Write("RoomEdit", "Room", id,
            $"แก้ไขห้อง #{id}: {old} → {room.RoomName} / {room.Size} คน / {room.PricePerHour}/ชม.");

        return RedirectToAction("RoomManagement");
    }

    [HttpPost]
    public IActionResult ToggleRoom(int id, string roomAction)
    {
        var room = _db.Rooms.FirstOrDefault(r => r.Id == id);
        if (room == null) return NotFound();

        room.IsActive  = roomAction == "enable";
        room.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        _log.Write("RoomToggle", "Room", id,
            $"{(room.IsActive == true ? "เปิด" : "ปิด")}ห้อง '{room.RoomName}'");

        return RedirectToAction("RoomManagement");
    }

    [HttpPost]
    public IActionResult DeleteRoom(int id)
    {
        var room = _db.Rooms.FirstOrDefault(r => r.Id == id);
        if (room == null) return NotFound();

        _log.Write("RoomDelete", "Room", id, $"ลบห้อง '{room.RoomName}'");

        _db.Rooms.Remove(room);
        _db.SaveChanges();
        return RedirectToAction("RoomManagement");
    }

    // ══ PROMOTIONS (ดูอย่างเดียว) ═════════════════════════
    public IActionResult Promotions()
    {
        var today  = DateOnly.FromDateTime(DateTime.Today);
        var promos = _db.Promotions.Include(p => p.CreatedByNavigation)
                        .OrderByDescending(p => p.CreatedAt).ToList();
        ViewBag.Today = today;
        return View(promos);
    }
}
