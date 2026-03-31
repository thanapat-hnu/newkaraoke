using System.ComponentModel.DataAnnotations;

namespace newkaraoke.ViewModels;

public partial class Users
{
    // public int Id { get; set; }
    // [Required(ErrorMessage = "กรุณากรอกชื่อ")]
    public string Name { get; set; } = null!;

    // [Required(ErrorMessage = "กรุณากรอกอีเมล")]
    // [EmailAddress(ErrorMessage = "รูปแบบอีเมลไม่ถูกต้อง")]
    public string Email { get; set; } = null!;

    // [Required(ErrorMessage = "กรุณากรอกรหัสผ่าน")]
    // [MinLength(6, ErrorMessage = "รหัสผ่านอย่างน้อย 6 ตัว")]
    public string Password { get; set; } = null!;

    // public string Role { get; set; } = null!;

    public string? ProfileImg { get; set; }

    // [Required(ErrorMessage = "กรุณากรอกเบอร์")]

    public string? Phone { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
