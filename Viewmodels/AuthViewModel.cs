using System.ComponentModel.DataAnnotations;

namespace newkaraoke.ViewModels;

// ── Login ──────────────────────────────────────────────
public class LoginViewModel
{
    [Required(ErrorMessage = "กรุณากรอกอีเมล")]
    [EmailAddress(ErrorMessage = "รูปแบบอีเมลไม่ถูกต้อง")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "กรุณากรอกรหัสผ่าน")]
    public string Password { get; set; } = "";
}

// ── Register ───────────────────────────────────────────
public class RegisterViewModel
{
    [Required(ErrorMessage = "กรุณากรอกชื่อ")]
    public string Name { get; set; } = "";

    [Required(ErrorMessage = "กรุณากรอกเบอร์โทร")]
    [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก")]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "กรุณากรอกอีเมล")]
    [EmailAddress(ErrorMessage = "รูปแบบอีเมลไม่ถูกต้อง")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "กรุณากรอกรหัสผ่าน")]
    [MinLength(6, ErrorMessage = "รหัสผ่านต้องอย่างน้อย 6 ตัว")]
    public string Password { get; set; } = "";
}
