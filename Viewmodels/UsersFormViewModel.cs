using System.ComponentModel.DataAnnotations;

namespace newkaraoke.ViewModels;

public class UserForm
{
    [Required(ErrorMessage = "กรุณากรอกชื่อ")]
    [Display(Name = "ชื่อ-นามสกุล")]
    public string Name { get; set; } = "";

    [Required(ErrorMessage = "กรุณากรอกอีเมล")]
    [EmailAddress(ErrorMessage = "รูปแบบอีเมลไม่ถูกต้อง")]
    [Display(Name = "อีเมล")]
    public string Email { get; set; } = "";

    // ตอน Create — Required / ตอน Edit — ไม่บังคับ (ถ้าว่างไม่เปลี่ยน)
    [MinLength(6, ErrorMessage = "รหัสผ่านต้องอย่างน้อย 6 ตัว")]
    [Display(Name = "รหัสผ่าน")]
    public string? Password { get; set; }

    [Required(ErrorMessage = "กรุณาเลือก Role")]
    [Display(Name = "Role")]
    public string Role { get; set; } = "staff";

    [Phone]
    [Display(Name = "เบอร์โทรศัพท์")]
    public string? Phone { get; set; }
}
