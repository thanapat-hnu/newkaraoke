using System.ComponentModel.DataAnnotations;

namespace newkaraoke.ViewModels;

public class ProfileViewModel
{
    public string Name     { get; set; } = "";
    public string Email    { get; set; } = "";
    public string? Phone   { get; set; }
    public string? JoinedAt { get; set; }

    // สถิติ
    public int     TotalBookings { get; set; }
    public double  TotalHours   { get; set; }
    public decimal TotalSpend   { get; set; }

    // ประวัติ 5 รายการล่าสุด
    public List<BookingRowDto> RecentBookings { get; set; } = new();
}

public class BookingRowDto
{
    public string   Code        { get; set; } = "";
    public string   RoomName    { get; set; } = "";
    public string   Date        { get; set; } = "";
    public string   Time        { get; set; } = "";
    public decimal  TotalPrice  { get; set; }
    public string?  Status      { get; set; }
}

// ── Edit Form ──────────────────────────────────────────
public class ProfileEditForm
{
    [Required(ErrorMessage = "กรุณากรอกชื่อ")]
    public string Name  { get; set; } = "";

    [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก")]
    public string? Phone { get; set; }
}

// ── Change Password Form ───────────────────────────────
public class ChangePasswordForm
{
    [Required(ErrorMessage = "กรุณากรอกรหัสผ่านปัจจุบัน")]
    public string CurrentPassword { get; set; } = "";

    [Required(ErrorMessage = "กรุณากรอกรหัสผ่านใหม่")]
    [MinLength(6, ErrorMessage = "รหัสผ่านต้องอย่างน้อย 6 ตัว")]
    public string NewPassword { get; set; } = "";
}
