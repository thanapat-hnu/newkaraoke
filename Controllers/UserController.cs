using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    // ══ AUTH ═════════════════════════════════════════════

    public IActionResult Index() => View();

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
            TempData["ActiveTab"]  = "login";
            TempData["LoginError"] = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
            return RedirectToAction("Auth");
        }

        if (user.Role != "customer")
        {
            TempData["ActiveTab"]  = "login";
            TempData["LoginError"] = "บัญชีนี้ไม่มีสิทธิ์เข้าใช้งาน";
            return RedirectToAction("Auth");
        }

        SetSession(user);
        return RedirectToAction("Index");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Register(Users model)
    {
        var email = model.Email.Trim().ToLower();

        if (_db.Users.Any(u => u.Email == email))
        {
            TempData["ActiveTab"]     = "register";
            TempData["RegisterError"] = "อีเมลนี้ถูกใช้งานแล้ว";
            return RedirectToAction("Auth");
        }

        var user = new User
        {
            Name      = model.Name.Trim(),
            Phone     = model.Phone?.Trim(),
            Email     = email,
            Password  = BCrypt.Net.BCrypt.HashPassword(model.Password),
            Role      = "customer",
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _db.Users.Add(user);
        _db.SaveChanges();

        SetSession(user);
        return RedirectToAction("Index");
    }

    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return RedirectToAction("Auth");
    }

    // ══ PROFILE ══════════════════════════════════════════

    public IActionResult Profile()
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        var userId = GetUserId();
        var user   = _db.Users
            .Include(u => u.Bookings)
                .ThenInclude(b => b.Room)
            .FirstOrDefault(u => u.Id == userId);

        if (user == null) return RedirectToAction("Auth");

        var confirmed  = user.Bookings.Where(b => b.Status == "confirmed").ToList();
        var totalHours = confirmed.Sum(b => (b.EndTime - b.StartTime).TotalHours);
        var recent     = user.Bookings
            .OrderByDescending(b => b.BookingDate)
            .Take(5)
            .Select(b => new BookingRowDto
            {
                Code       = b.BookingCode,
                RoomName   = b.Room.RoomName,
                Date       = b.BookingDate.ToString("dd/MM/yyyy"),
                Time       = $"{b.StartTime:HH:mm} – {b.EndTime:HH:mm}",
                TotalPrice = b.TotalPrice,
                Status     = b.Status
            }).ToList();

        return View(new ProfileViewModel
        {
            Name           = user.Name,
            Email          = user.Email,
            Phone          = user.Phone,
            JoinedAt       = user.CreatedAt?.ToString("MMMM yyyy"),
            TotalBookings  = user.Bookings.Count,
            TotalHours     = totalHours,
            TotalSpend     = confirmed.Sum(b => b.TotalPrice),
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

        user.Name      = form.Name.Trim();
        user.Phone     = form.Phone?.Trim();
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

        user.Password  = BCrypt.Net.BCrypt.HashPassword(form.NewPassword);
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
                Id           = r.Id,
                RoomName     = r.RoomName,
                Size         = r.Size,
                PricePerHour = r.PricePerHour,
                ImageUrl     = r.ImageUrl
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
                    Id           = r.Id,
                    RoomName     = r.RoomName,
                    Size         = r.Size,
                    PricePerHour = r.PricePerHour,
                    ImageUrl     = r.ImageUrl
                }).ToList();

            return View("Booking", new BookingPageViewModel
            {
                Rooms          = rooms,
                Error          = "กรุณากรอกข้อมูลให้ครบทุกขั้นตอน",
                SelectedDate   = form.Date,
                People         = form.People,
                SelectedRoomId = form.RoomId,
                SelectedStart  = form.StartTime,
                SelectedEnd    = form.EndTime
            });
        }

        var room      = _db.Rooms.Find(form.RoomId);
        if (room == null) return RedirectToAction("Booking");

        var startTime = TimeOnly.Parse(form.StartTime);
        var endTime   = TimeOnly.Parse(form.EndTime);
        var hours     = (endTime - startTime).TotalHours;
        var basePrice = room.PricePerHour * (decimal)hours;

        return View("BookingConfirm", new BookingConfirmViewModel
        {
            RoomName    = room.RoomName,
            DateDisplay = DateTime.Parse(form.Date).ToString("dd MMMM yyyy"),
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

        var startTime  = TimeOnly.Parse(form.StartTime);
        var endTime    = TimeOnly.Parse(form.EndTime);
        var hours      = (endTime - startTime).TotalHours;
        var basePrice  = room.PricePerHour * (decimal)hours;
        var total      = basePrice;
        var discount   = 0m;
        var promoMsg   = "";
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
                    "percent"   => basePrice * promo.Value / 100,
                    "fixed"     => promo.Value,
                    "free_hour" => room.PricePerHour * promo.Value,
                    _           => 0
                };
                discount   = Math.Min(discount, basePrice);
                total      = basePrice - discount;
                promoMsg   = $"ใช้โค้ด {promo.Name} ลด ฿{discount:N0}";
                promoValid = true;
            }
            else
            {
                promoMsg = "โค้ดไม่ถูกต้องหรือหมดอายุแล้ว";
            }
        }

        return View("BookingConfirm", new BookingConfirmViewModel
        {
            RoomName     = room.RoomName,
            DateDisplay  = DateTime.Parse(form.Date).ToString("dd MMMM yyyy"),
            TimeDisplay  = $"{form.StartTime} – {form.EndTime}",
            Hours        = hours,
            People       = form.People,
            BasePrice    = basePrice,
            TotalPrice   = total,
            Discount     = discount,
            PromoCode    = form.PromoCode,
            PromoMessage = promoMsg,
            PromoValid   = promoValid,
            RoomId       = form.RoomId,
            Date         = form.Date,
            StartTime    = form.StartTime,
            EndTime      = form.EndTime,
            PeopleCount  = form.People
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
        var room        = _db.Rooms.Find(form.RoomId);
        if (room == null) return RedirectToAction("Booking");

        var conflict = _db.Bookings.Any(b =>
            b.RoomId == form.RoomId && b.BookingDate == bookingDate &&
            b.Status != "cancelled" && b.StartTime < endTime && b.EndTime > startTime);

        if (conflict)
        {
            TempData["Error"] = "ห้องนี้มีการจองในช่วงเวลาดังกล่าวแล้ว";
            return RedirectToAction("Booking");
        }

        var hours      = (decimal)(endTime - startTime).TotalHours;
        var totalPrice = room.PricePerHour * hours;
        int? promoId   = null;

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
                    "percent"   => totalPrice * (1 - promo.Value / 100),
                    "fixed"     => Math.Max(0, totalPrice - promo.Value),
                    "free_hour" => Math.Max(0, totalPrice - room.PricePerHour * promo.Value),
                    _           => totalPrice
                };
                promoId = promo.Id;
                promo.UsedCount = (promo.UsedCount ?? 0) + 1;
            }
        }

        // counter = pending, promptpay/card = confirmed
        var status = form.PayMethod == "counter" ? "pending" : "confirmed";
        var code   = "NS-" + DateTime.Now.ToString("yyMMddHHmm") + new Random().Next(10, 99);

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

        var payLabel = form.PayMethod switch
        {
            "counter"   => "ชำระที่เคาน์เตอร์",
            "promptpay" => "PromptPay",
            "card"      => "บัตรเครดิต/เดบิต",
            _           => form.PayMethod
        };

        return View("BookingSuccess", new BookingSuccessViewModel
        {
            BookingCode = code,
            RoomName    = room.RoomName,
            DateDisplay = bookingDate.ToString("dd MMMM yyyy"),
            TimeDisplay = $"{startTime:HH:mm} – {endTime:HH:mm}",
            TotalPrice  = Math.Round(totalPrice, 2),
            PayMethod   = payLabel,
            Status      = status
        });
    }

    // GET /User/BookingHistory
    public IActionResult BookingHistory()
    {
        if (!IsCustomer()) return RedirectToAction("Auth");

        var userId   = GetUserId();
        var bookings = _db.Bookings
            .Include(b => b.Room)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .Select(b => new BookingRowDto
            {
                Code       = b.BookingCode,
                RoomName   = b.Room.RoomName,
                Date       = b.BookingDate.ToString("dd/MM/yyyy"),
                Time       = $"{b.StartTime:HH:mm} – {b.EndTime:HH:mm}",
                TotalPrice = b.TotalPrice,
                Status     = b.Status
            }).ToList();

        return View(bookings);
    }
}
