using newkaraoke.Models.db;

namespace newkaraoke.Services;

/// <summary>
/// Service กลางสำหรับบันทึก Activity Log ลง DB
/// ใช้งานโดย Inject ผ่าน DI แล้วเรียก Write() ใน Controller
/// </summary>
public class LogService
{
    private readonly KaraokeDbContext _db;
    private readonly IHttpContextAccessor _http;

    public LogService(KaraokeDbContext db, IHttpContextAccessor http)
    {
        _db  = db;
        _http = http;
    }

    /// <summary>
    /// บันทึก log 1 รายการ
    /// </summary>
    /// <param name="action">ชื่อ action เช่น "Login", "BookingCreate", "UserDelete"</param>
    /// <param name="entity">ชื่อ table/object ที่เกี่ยวข้อง เช่น "Booking", "User", "Room"</param>
    /// <param name="entityId">ID ของ record ที่เกี่ยวข้อง (ถ้ามี)</param>
    /// <param name="description">คำอธิบายเพิ่มเติม เช่น "จองห้อง Galaxy S วันที่ 05/04/2026"</param>
    /// <param name="userId">UserId (ถ้าไม่ส่งจะดึงจาก Session อัตโนมัติ)</param>
    public void Write(string action, string? entity = null, int? entityId = null,
                      string? description = null, int? userId = null)
    {
        var ctx = _http.HttpContext;

        // ดึง UserId จาก Session ถ้าไม่ได้ส่งมา
        if (userId == null && ctx != null)
        {
            var sid = ctx.Session.GetString("UserId");
            if (int.TryParse(sid, out var uid)) userId = uid;
        }

        var log = new Log
        {
            UserId      = userId,
            Action      = action,
            Entity      = entity,
            EntityId    = entityId,
            Description = description,
            IpAddress   = ctx?.Connection.RemoteIpAddress?.ToString(),
            UserAgent   = ctx?.Request.Headers.UserAgent.ToString(),
            CreatedAt   = DateTime.Now
        };

        _db.Logs.Add(log);
        _db.SaveChanges();
    }
}
