using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using newkaraoke.Models.db;

namespace newkaraoke.Controllers;

public class CeoController : Controller
{
    private readonly KaraokeDbContext _db;

    public CeoController(KaraokeDbContext db) { _db = db; }

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var role = HttpContext.Session.GetString("UserRole");
        if (role != "admin" && role != "ceo")
            context.Result = Redirect("/StaffAuth/login");
        base.OnActionExecuting(context);
    }

    // helper: กรองช่วงวัน
    private (DateOnly from, DateOnly to) GetRange(int range)
    {
        var to   = DateOnly.FromDateTime(DateTime.Today);
        var from = range == 0 ? new DateOnly(2000, 1, 1)
                              : to.AddDays(-range + 1);
        return (from, to);
    }

    private void SetCommonViewBag(string action, int range)
    {
        ViewBag.CurrentAction = action;
        ViewBag.Range = range;
    }

    public IActionResult Index() => RedirectToAction("Revenue");

    // ══ REVENUE ══════════════════════════════════════════
    public IActionResult Revenue(int range = 30)
    {
        SetCommonViewBag("Revenue", range);
        ViewBag.Title     = "รายรับ";
        ViewBag.ActiveNav = "revenue";

        var (from, to) = GetRange(range);

        var bookings = _db.Bookings
            .Where(b => b.Status == "confirmed"
                     && b.BookingDate >= from
                     && b.BookingDate <= to)
            .Include(b => b.Room)
            .Include(b => b.User)
            .ToList();

        // KPI
        var totalRev  = bookings.Sum(b => b.TotalPrice);
        var totalBk   = bookings.Count;
        var avgPerBk  = totalBk > 0 ? totalRev / totalBk : 0;

        // prev period for delta
        var prevFrom = from.AddDays(-(range == 0 ? 0 : range));
        var prevTo   = from.AddDays(-1);
        var prevRev  = range == 0 ? 0m : _db.Bookings
            .Where(b => b.Status == "confirmed"
                     && b.BookingDate >= prevFrom
                     && b.BookingDate <= prevTo)
            .Sum(b => (decimal?)b.TotalPrice) ?? 0m;

        ViewBag.TotalRev  = totalRev;
        ViewBag.TotalBk   = totalBk;
        ViewBag.AvgPerBk  = avgPerBk;
        ViewBag.PrevRev   = prevRev;

        // รายรับรายวัน (30 วันล่าสุด หรือตามช่วง)
        var daily = bookings
            .GroupBy(b => b.BookingDate)
            .Select(g => new { Date = g.Key, Rev = g.Sum(b => b.TotalPrice) })
            .OrderBy(x => x.Date)
            .ToList();

        ViewBag.DailyDates = daily.Select(x => x.Date.ToString("dd/MM")).ToList();
        ViewBag.DailyRevs  = daily.Select(x => x.Rev).ToList();

        // รายรับตามห้อง
        var byRoom = bookings
            .GroupBy(b => b.Room.RoomName)
            .Select(g => new { Room = g.Key, Rev = g.Sum(b => b.TotalPrice), Count = g.Count() })
            .OrderByDescending(x => x.Rev)
            .ToList();

        ViewBag.RoomNames = byRoom.Select(x => x.Room).ToList();
        ViewBag.RoomRevs  = byRoom.Select(x => x.Rev).ToList();
        ViewBag.RoomCounts= byRoom.Select(x => x.Count).ToList();

        // top bookings
        ViewBag.TopBookings = bookings
            .OrderByDescending(b => b.TotalPrice)
            .Take(10)
            .Select(b => new {
                b.BookingCode,
                UserName  = b.User.Name,
                RoomName  = b.Room.RoomName,
                Date      = b.BookingDate.ToString("dd/MM/yyyy"),
                b.TotalPrice
            }).ToList();

        return View();
    }

    // ══ ROOMS ════════════════════════════════════════════
    public IActionResult Rooms(int range = 30)
    {
        SetCommonViewBag("Rooms", range);
        ViewBag.Title     = "วิเคราะห์ห้อง";
        ViewBag.ActiveNav = "rooms";

        var (from, to) = GetRange(range);

        var rooms = _db.Rooms.ToList();
        var bookings = _db.Bookings
            .Where(b => b.BookingDate >= from && b.BookingDate <= to && b.Status != "cancelled")
            .Include(b => b.Room)
            .ToList();

        var days = range == 0 ? 365 : range;
        // occupancy: เปิด 12 ชม./วัน (14:00-02:00)
        decimal hoursPerDay = 12m;
        decimal totalHours  = days * hoursPerDay;

        var stats = rooms.Select(r => {
            var rb    = bookings.Where(b => b.RoomId == r.Id).ToList();
            var usedH = rb.Sum(b => (decimal)(b.EndTime - b.StartTime).TotalHours
                                    + (b.EndTime < b.StartTime ? 24 : 0));
            var rev   = rb.Where(b => b.Status == "confirmed").Sum(b => b.TotalPrice);
            var occ   = totalHours > 0 ? Math.Min(100, Math.Round(usedH / totalHours * 100, 1)) : 0;
            return new {
                r.Id, r.RoomName, r.Size, r.PricePerHour,
                IsActive = r.IsActive ?? false,
                BookingCount = rb.Count,
                Revenue = rev,
                UsedHours = Math.Round(usedH, 1),
                Occupancy = occ
            };
        }).OrderByDescending(x => x.Revenue).ToList();

        ViewBag.RoomStats  = stats;
        ViewBag.RoomNames2 = stats.Select(x => x.RoomName).ToList();
        ViewBag.RoomOccs   = stats.Select(x => x.Occupancy).ToList();
        ViewBag.RoomRevs2  = stats.Select(x => x.Revenue).ToList();
        ViewBag.RoomBkCnt  = stats.Select(x => x.BookingCount).ToList();

        return View();
    }

    // ══ HEATMAP ══════════════════════════════════════════
    public IActionResult Heatmap(int range = 30)
    {
        SetCommonViewBag("Heatmap", range);
        ViewBag.Title     = "Heatmap";
        ViewBag.ActiveNav = "heatmap";

        var (from, to) = GetRange(range);

        var bookings = _db.Bookings
            .Where(b => b.BookingDate >= from && b.BookingDate <= to && b.Status != "cancelled")
            .ToList();

        // DOW x Hour matrix (14-01)
        var dows  = new[] { "อา", "จ", "อ", "พ", "พฤ", "ศ", "ส" };
        var hours = Enumerable.Range(14, 12).Select(h => h % 24).ToList(); // 14,15,...,23,0,1

        var mat = new int[7, 12];
        foreach (var b in bookings)
        {
            var dow = (int)b.BookingDate.DayOfWeek;
            var h   = b.StartTime.Hour;
            var col = hours.IndexOf(h);
            if (col >= 0) mat[dow, col]++;
        }

        ViewBag.Dows      = dows;
        ViewBag.HeatHours = hours.Select(h => h.ToString("D2") + ":00").ToList();
        ViewBag.HeatMat   = mat;
        ViewBag.HeatMax   = Enumerable.Range(0, 7)
                                .SelectMany(d => Enumerable.Range(0, 12).Select(h => mat[d, h]))
                                .DefaultIfEmpty(1).Max();

        // ชั่วโมงยอดนิยม
        var hourCount = hours.Select((h, i) =>
            new { Label = h.ToString("D2") + ":00",
                  Count = Enumerable.Range(0, 7).Sum(d => mat[d, i]) }).ToList();
        ViewBag.PeakHours  = hourCount.Select(x => x.Label).ToList();
        ViewBag.PeakCounts = hourCount.Select(x => x.Count).ToList();

        // DOW summary
        var dowCount = Enumerable.Range(0, 7)
            .Select(d => new { Day = dows[d],
                               Count = Enumerable.Range(0, 12).Sum(h => mat[d, h]) }).ToList();
        ViewBag.DowDays   = dowCount.Select(x => x.Day).ToList();
        ViewBag.DowCounts = dowCount.Select(x => x.Count).ToList();

        return View();
    }

    // ══ CUSTOMERS ════════════════════════════════════════
    public IActionResult Customers(int range = 30)
    {
        SetCommonViewBag("Customers", range);
        ViewBag.Title     = "ลูกค้า";
        ViewBag.ActiveNav = "customers";

        var (from, to) = GetRange(range);

        var customers = _db.Users
            .Where(u => u.Role == "customer")
            .Include(u => u.Bookings)
            .ToList();

        var totalCustomers = customers.Count;

        // new vs returning (period)
        var newInPeriod = customers.Count(u =>
            u.Bookings.Any(b => b.BookingDate >= from && b.BookingDate <= to)
            && !u.Bookings.Any(b => b.BookingDate < from));

        var returning = customers.Count(u =>
            u.Bookings.Any(b => b.BookingDate >= from && b.BookingDate <= to)
            && u.Bookings.Any(b => b.BookingDate < from));

        ViewBag.TotalCustomers = totalCustomers;
        ViewBag.NewCustomers   = newInPeriod;
        ViewBag.Returning      = returning;

        // top customers by spend
        var top = customers
            .Select(u => new {
                u.Name, u.Email, u.Phone,
                JoinedAt = u.CreatedAt?.ToString("dd/MM/yyyy") ?? "—",
                TotalBk  = u.Bookings.Count(b => b.Status == "confirmed"),
                TotalRev = u.Bookings.Where(b => b.Status == "confirmed").Sum(b => b.TotalPrice),
                LastBk   = u.Bookings.OrderByDescending(b => b.BookingDate)
                             .FirstOrDefault()?.BookingDate.ToString("dd/MM/yyyy") ?? "—"
            })
            .OrderByDescending(x => x.TotalRev)
            .Take(20)
            .ToList();

        ViewBag.TopCustomers = top;

        // สมาชิกใหม่รายวัน (14 วันล่าสุด)
        var newPerDay = customers
            .Where(u => u.CreatedAt.HasValue && u.CreatedAt.Value >= DateTime.Today.AddDays(-13))
            .GroupBy(u => DateOnly.FromDateTime(u.CreatedAt!.Value))
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToList();

        ViewBag.NewDates  = newPerDay.Select(x => x.Date.ToString("dd/MM")).ToList();
        ViewBag.NewCounts = newPerDay.Select(x => x.Count).ToList();

        return View();
    }
}
