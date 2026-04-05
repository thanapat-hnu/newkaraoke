using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using newkaraoke.Models.db;
using newkaraoke.Services;
using newkaraoke.ViewModels;

namespace newkaraoke.Controllers;

public class UserController : Controller
{
    private readonly KaraokeDbContext _db;
    private readonly LogService _log;

    public UserController(KaraokeDbContext db, LogService log)
    {
        _db  = db;
        _log = log;
    }

    // ── helpers ──────────────────────────────────────────
    private void SetSession(User user)
    {
        HttpContext.Session.SetString("UserId",    user.Id.ToString());
        HttpContext.Session.SetString("UserName",  user.Name);
        HttpContext.Session.SetString("UserEmail", user.Email);
        HttpContext.Session.SetString("UserRole",  user.Role);
    }

    private bool IsCustomer()
        => HttpContext.Session.GetString("UserRole") == "customer";

    private int GetUserId()
        => int.Parse(HttpContext.Session.GetString("UserId") ?? "0");

    // แปลงวันที่เป็นภาษาไทย เช่น "5 เมษายน 2569"
    private static readonly string[] ThaiMonths = {
        "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
        "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
    };
    private static string ToThaiDate(DateOnly d)
        => $"{d.Day} {ThaiMonths[d.Month - 1]} {d.Year + 543}";
    private static string ToThaiDate(string isoDate)
        => ToThaiDate(DateOnly.Parse(isoDate));
    // คำนวณชั่วโมง รองรับ overnight
    private static double CalcHours(TimeOnly start, TimeOnly end)
        => end > start
            ? (end - start).TotalHours
            : (new TimeSpan(24, 0, 0) - start.ToTimeSpan() + end.ToTimeSpan()).TotalHours;

    // ══ AUTH ═════════════════════════════════════════════

    public IActionResult Index()
    {
        var role = HttpContext.Session.GetString("UserRole");
        if (role != null && role != "customer")
            return Redirect("/StaffAuth/login");

        var rooms = _db.Rooms
            .Where(r => r.IsActive == true)
            .OrderBy(r => r.Size)
            .ToList();

        var activePromos = _db.Promotions
            .Where(p => (p.IsActive ?? false)
                     && p.StartDate <= DateOnly.FromDateTime(DateTime.Today)
                     && p.EndDate   >= DateOnly.FromDateTime(DateTime.Today)
                     && (!p.UsageLimit.HasValue || (p.UsedCount ?? 0) < p.UsageLimit.Value))
            .OrderBy(p => p.EndDate)
            .Take(3)
            .ToList();

        ViewBag.Rooms        = rooms;
        ViewBag.ActivePromos = activePromos;
        ViewBag.RoomCount    = rooms.Count;

        return View();
    }

    public IActionResult Auth()
    {
        if (IsCustomer()) return RedirectToAction("Index");
        return View();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Login(Users model)
    {
        var user = _db.Users.FirstOrDefault(u => u.Email == model.Email.Trim().ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.Password))
        {
            TempData["ActiveTab"] = "login";
            TempData["LoginError"] = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
            return RedirectToAction("Auth");
        }

        if (user.Role != "customer")
        {
            TempData["ActiveTab"] = "login";
            TempData["LoginError"] = "บัญชีนี้ไม่มีสิทธิ์เข้าใช้งาน";
            return RedirectToAction("Auth");
        }

        SetSession(user);
        _log.Write("Login", "User", user.Id, $"{user.Name} เข้าสู่ระบบ (customer)", user.Id);
        return RedirectToAction("Index");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Register(Users model)
    {
        var email = model.Email.Trim().ToLower();

        if (_db.Users.Any(u => u.Email == email))
        {
            TempData["ActiveTab"] = "register";
            TempData["RegisterError"] = "อีเมลนี้ถูกใช้งานแล้ว";
            return RedirectToAction("Auth");
        }

        var user = new User
        {
            Name = model.Name.Trim(),
            Phone = model.Phone?.Trim(),
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(model.Password),
            Role = "customer",
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _db.Users.Add(user);
        _db.SaveChanges();

        SetSession(user);
        _log.Write("Register", "User", user.Id, $"สมัครสมาชิกใหม่: {user.Name} ({user.Email})", user.Id);
        return RedirectToAction("Index");
    }

    public IActionResult Logout()
    {
        var name = HttpContext.Session.GetString("UserName");
        _log.Write("Logout", "User", null, $"{name} ออกจากระบบ (customer)");
        HttpContext.Session.Clear();
        return RedirectToAction("Auth");
    }

    // ══ PROFILE ══════════════════════════════════════════

    public IActionResult Profile()
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        var userId = GetUserId();
        var user = _db.Users
            .Include(u => u.Bookings)
                .ThenInclude(b => b.Room)
            .FirstOrDefault(u => u.Id == userId);

        if (user == null) return RedirectToAction("Auth");

        var confirmed = user.Bookings.Where(b => b.Status == "confirmed").ToList();
        var totalHours = confirmed.Sum(b => (b.EndTime - b.StartTime).TotalHours);
        var recent = user.Bookings
            .OrderByDescending(b => b.BookingDate)
            .Take(5)
            .Select(b => new BookingRowDto
            {
                Code = b.BookingCode,
                RoomName = b.Room.RoomName,
                Date = b.BookingDate.ToString("dd/MM/yyyy"),
                Time = $"{b.StartTime:HH:mm} – {b.EndTime:HH:mm}",
                TotalPrice = b.TotalPrice,
                Status = b.Status
            }).ToList();

        return View(new ProfileViewModel
        {
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            JoinedAt = user.CreatedAt?.ToString("MMMM yyyy"),
            TotalBookings = user.Bookings.Count,
            TotalHours = totalHours,
            TotalSpend = confirmed.Sum(b => b.TotalPrice),
            RecentBookings = recent
        });
    }

    public IActionResult ProfileEdit()
    {
        if (!IsCustomer()) return RedirectToAction("Auth");
        var user = _db.Users.Find(GetUserId());
        if (user == null) return RedirectToAction("Auth");
        ViewBag.Phone = user.Phone;
        return View();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult ProfileEditSave(ProfileEditForm form)
    {
        if (!IsCustomer()) return RedirectToAction("Auth");
        if (!ModelState.IsValid)
        {
            TempData["EditError"] = "กรุณากรอกข้อมูลให้ถูกต้อง";
            return RedirectToAction("ProfileEdit");
        }

        var user = _db.Users.Find(GetUserId());
        if (user == null) return RedirectToAction("Auth");

        user.Name = form.Name.Trim();
        user.Phone = form.Phone?.Trim();
        user.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        HttpContext.Session.SetString("UserName", user.Name);
        TempData["EditSuccess"] = "บันทึกข้อมูลเรียบร้อยแล้ว";
        return RedirectToAction("ProfileEdit");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult ChangePassword(ChangePasswordForm form)
    {
        if (!IsCustomer()) return RedirectToAction("Auth");
        if (!ModelState.IsValid)
        {
            TempData["PassError"] = "กรุณากรอกข้อมูลให้ครบ";
            return RedirectToAction("ProfileEdit");
        }

        var user = _db.Users.Find(GetUserId());
        if (user == null) return RedirectToAction("Auth");

        if (!BCrypt.Net.BCrypt.Verify(form.CurrentPassword, user.Password))
        {
            TempData["PassError"] = "รหัสผ่านปัจจุบันไม่ถูกต้อง";
            return RedirectToAction("ProfileEdit");
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(form.NewPassword);
        user.UpdatedAt = DateTime.Now;
        _db.SaveChanges();

        TempData["PassSuccess"] = "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว";
        return RedirectToAction("ProfileEdit");
    }

    // ══ BOOKING ══════════════════════════════════════════

    // GET /User/Booking
    public IActionResult Booking()
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        var rooms = _db.Rooms
            .Where(r => r.IsActive == true)
            .Select(r => new RoomSelectDto
            {
                Id = r.Id,
                RoomName = r.RoomName,
                Size = r.Size,
                PricePerHour = r.PricePerHour,
                ImageUrl = r.ImageUrl
            }).ToList();

        return View(new BookingPageViewModel { Rooms = rooms });
    }

    // POST /User/BookingSubmit — รับ form แล้วไปหน้า Confirm
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult BookingSubmit(BookingStepForm form)
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        if (string.IsNullOrEmpty(form.Date) || form.RoomId == 0 ||
            string.IsNullOrEmpty(form.StartTime) || string.IsNullOrEmpty(form.EndTime))
        {
            var rooms = _db.Rooms.Where(r => r.IsActive == true)
                .Select(r => new RoomSelectDto
                {
                    Id = r.Id,
                    RoomName = r.RoomName,
                    Size = r.Size,
                    PricePerHour = r.PricePerHour,
                    ImageUrl = r.ImageUrl
                }).ToList();

            return View("Booking", new BookingPageViewModel
            {
                Rooms = rooms,
                Error = "กรุณากรอกข้อมูลให้ครบทุกขั้นตอน",
                SelectedDate = form.Date,
                People = form.People,
                SelectedRoomId = form.RoomId,
                SelectedStart = form.StartTime,
                SelectedEnd = form.EndTime
            });
        }

        var room = _db.Rooms.Find(form.RoomId);
        if (room == null) return RedirectToAction("Booking");

        var startTime = TimeOnly.Parse(form.StartTime);
        var endTime   = TimeOnly.Parse(form.EndTime);
        var hours     = CalcHours(startTime, endTime);
        var basePrice = room.PricePerHour * (decimal)hours;

        return View("BookingConfirm", new BookingConfirmViewModel
        {
            RoomName    = room.RoomName,
            DateDisplay = ToThaiDate(form.Date),
            TimeDisplay = $"{form.StartTime} – {form.EndTime}",
            Hours       = hours,
            People      = form.People,
            BasePrice   = basePrice,
            TotalPrice  = basePrice,
            RoomId      = form.RoomId,
            Date        = form.Date,
            StartTime   = form.StartTime,
            EndTime     = form.EndTime,
            PeopleCount = form.People
        });
    }

    // POST /User/ApplyPromo — ใช้โค้ดส่วนลด แล้วกลับไปหน้า Confirm
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult ApplyPromo(BookingPayForm form)
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        var room = _db.Rooms.Find(form.RoomId);
        if (room == null) return RedirectToAction("Booking");

        var startTime = TimeOnly.Parse(form.StartTime);
        var endTime   = TimeOnly.Parse(form.EndTime);
        var hours     = CalcHours(startTime, endTime);
        var basePrice = room.PricePerHour * (decimal)hours;
        var total = basePrice;
        var discount = 0m;
        var promoMsg = "";
        var promoValid = false;

        if (!string.IsNullOrEmpty(form.PromoCode))
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var promo = _db.Promotions.FirstOrDefault(p =>
                p.Name == form.PromoCode.Trim().ToUpper() &&
                (p.IsActive ?? false) && p.StartDate <= today && p.EndDate >= today &&
                (!p.UsageLimit.HasValue || (p.UsedCount ?? 0) < p.UsageLimit.Value));

            if (promo != null)
            {
                discount = promo.DiscountType switch
                {
                    "percent" => basePrice * promo.Value / 100,
                    "fixed" => promo.Value,
                    "free_hour" => room.PricePerHour * promo.Value,
                    _ => 0
                };
                discount = Math.Min(discount, basePrice);
                total = basePrice - discount;
                promoMsg = $"ใช้โค้ด {promo.Name} ลด ฿{discount:N0}";
                promoValid = true;
            }
            else
            {
                promoMsg = "โค้ดไม่ถูกต้องหรือหมดอายุแล้ว";
            }
        }

        return View("BookingConfirm", new BookingConfirmViewModel
        {
            RoomName = room.RoomName,
            DateDisplay = ToThaiDate(form.Date),
            TimeDisplay = $"{form.StartTime} – {form.EndTime}",
            Hours = hours,
            People = form.People,
            BasePrice = basePrice,
            TotalPrice = total,
            Discount = discount,
            PromoCode = form.PromoCode,
            PromoMessage = promoMsg,
            PromoValid = promoValid,
            RoomId = form.RoomId,
            Date = form.Date,
            StartTime = form.StartTime,
            EndTime = form.EndTime,
            PeopleCount = form.People
        });
    }

    // POST /User/BookingPay — สร้าง Booking จริงใน DB
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult BookingPay(BookingPayForm form)
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        var bookingDate = DateOnly.Parse(form.Date);
        var startTime   = TimeOnly.Parse(form.StartTime);
        var endTime     = TimeOnly.Parse(form.EndTime);
        var room = _db.Rooms.Find(form.RoomId);
        if (room == null) return RedirectToAction("Booking");

        // คำนวณชั่วโมง — รองรับ overnight (EndTime < StartTime = ข้ามเที่ยงคืน)
        var hours = endTime > startTime
            ? (decimal)(endTime - startTime).TotalHours
            : (decimal)(new TimeSpan(24,0,0) - startTime.ToTimeSpan() + endTime.ToTimeSpan()).TotalHours;
        if (hours <= 0) hours = 1;

        // conflict check — overnight-aware
        var conflict = _db.Bookings.Any(b =>
            b.RoomId == form.RoomId &&
            b.BookingDate == bookingDate &&
            b.Status != "cancelled" &&
            b.StartTime < endTime && b.EndTime > startTime);

        if (conflict)
        {
            TempData["Error"] = "ห้องนี้มีการจองในช่วงเวลาดังกล่าวแล้ว";
            return RedirectToAction("Booking");
        }

        var totalPrice = room.PricePerHour * hours;
        int? promoId = null;

        if (!string.IsNullOrEmpty(form.PromoCode))
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var promo = _db.Promotions.FirstOrDefault(p =>
                p.Name == form.PromoCode.Trim().ToUpper() &&
                (p.IsActive ?? false) && p.StartDate <= today && p.EndDate >= today &&
                (!p.UsageLimit.HasValue || (p.UsedCount ?? 0) < p.UsageLimit.Value));

            if (promo != null)
            {
                totalPrice = promo.DiscountType switch
                {
                    "percent" => totalPrice * (1 - promo.Value / 100),
                    "fixed" => Math.Max(0, totalPrice - promo.Value),
                    "free_hour" => Math.Max(0, totalPrice - room.PricePerHour * promo.Value),
                    _ => totalPrice
                };
                promoId = promo.Id;
                promo.UsedCount = (promo.UsedCount ?? 0) + 1;
            }
        }

        // counter = pending, promptpay/card = confirmed
        var status = form.PayMethod == "counter" ? "pending" : "confirmed";
        var code = "NS-" + DateTime.Now.ToString("yyMMddHHmm") + new Random().Next(10, 99);

        _db.Bookings.Add(new Booking
        {
            UserId      = GetUserId(),
            RoomId      = form.RoomId,
            PromotionId = promoId,
            BookingDate = bookingDate,
            StartTime   = startTime,
            EndTime     = endTime,
            TotalPrice  = Math.Round(totalPrice, 2),
            BookingCode = code,
            Status      = status,
            CreatedAt   = DateTime.Now,
            UpdatedAt   = DateTime.Now
        });
        _db.SaveChanges();

        _log.Write("BookingCreate", "Booking", null,
            $"จองห้อง {room.RoomName} วันที่ {bookingDate:dd/MM/yyyy} {startTime:HH:mm}-{endTime:HH:mm} รหัส {code} ยอด {Math.Round(totalPrice,2):N0}฿");

        var payLabel = form.PayMethod switch
        {
            "counter" => "ชำระที่เคาน์เตอร์",
            "promptpay" => "PromptPay",
            "card" => "บัตรเครดิต/เดบิต",
            _ => form.PayMethod
        };

        return View("BookingSuccess", new BookingSuccessViewModel
        {
            BookingCode = code,
            RoomName = room.RoomName,
            DateDisplay = ToThaiDate(bookingDate),
            TimeDisplay = $"{startTime:HH:mm} – {endTime:HH:mm}",
            TotalPrice = Math.Round(totalPrice, 2),
            PayMethod = payLabel,
            Status = status
        });
    }

    // GET /User/BookingHistory
    public IActionResult BookingHistory()
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        var userId = GetUserId();
        var bookings = _db.Bookings
            .Include(b => b.Room)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .Select(b => new BookingRowDto
            {
                Code = b.BookingCode,
                RoomName = b.Room.RoomName,
                Date = b.BookingDate.ToString("dd/MM/yyyy"),
                Time = $"{b.StartTime:HH:mm} – {b.EndTime:HH:mm}",
                TotalPrice = b.TotalPrice,
                Status = b.Status
            }).ToList();

        return View(bookings);
    }

    public IActionResult GetBookedSlots(int roomId, string date)
    {
        if (!DateOnly.TryParse(date, out var bookingDate))
            return Json(new List<object>());

        var slots = _db.Bookings
            .Where(b => b.RoomId == roomId &&
                        b.BookingDate == bookingDate &&
                        b.Status != "cancelled")
            .Select(b => new { start = b.StartTime.ToString("HH:mm"), end = b.EndTime.ToString("HH:mm") })
            .ToList();

        return Json(slots);
    }

    // GET /User/GetFullyBookedDates — คืน list วันที่ทุกห้องเต็มตลอดวัน (14:00-02:00)
    public IActionResult GetFullyBookedDates()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var max   = today.AddDays(7);
        var totalRooms = _db.Rooms.Count(r => r.IsActive == true);
        if (totalRooms == 0) return Json(new List<string>());

        // ช่วงเวลาทำการ: 14:00 – 02:00 (วันถัดไป) = 12 ชั่วโมง
        var openTime  = new TimeOnly(14, 0);
        var closeTime = new TimeOnly(2, 0);

        var fullDays = new List<string>();

        for (var d = today; d <= max; d = d.AddDays(1))
        {
            var bookings = _db.Bookings
                .Where(b => b.BookingDate == d && b.Status != "cancelled")
                .Select(b => new { b.RoomId, b.StartTime, b.EndTime })
                .ToList();

            // สำหรับแต่ละห้อง เช็คว่า cover ตลอด 14:00-02:00 ไหม
            // ถ้าทุกห้อง cover หมด = วันเต็ม
            int fullRooms = 0;
            var rooms = _db.Rooms.Where(r => r.IsActive == true).Select(r => r.Id).ToList();

            foreach (var roomId in rooms)
            {
                var roomBookings = bookings.Where(b => b.RoomId == roomId).ToList();
                // ตรวจว่าช่วง 14:00-26:00 (02:00+24h) ถูกครอบคลุมหมดไหม
                // แปลง TimeOnly เป็น minutes จาก midnight, handle overnight
                int open  = 14 * 60;
                int close = 26 * 60; // 02:00 วันถัดไป

                // เรียงการจองตามเวลาเริ่ม
                var sorted = roomBookings
                    .Select(b => new {
                        start = b.StartTime.Hour * 60 + b.StartTime.Minute,
                        end   = (b.EndTime.Hour < 14 ? b.EndTime.Hour + 24 : b.EndTime.Hour) * 60 + b.EndTime.Minute
                    })
                    .OrderBy(b => b.start)
                    .ToList();

                int covered = open;
                foreach (var b in sorted)
                {
                    if (b.start <= covered) covered = Math.Max(covered, b.end);
                    else break;
                }
                if (covered >= close) fullRooms++;
            }

            if (fullRooms >= totalRooms)
                fullDays.Add(d.ToString("yyyy-MM-dd"));
        }

        return Json(fullDays);
    }
}
