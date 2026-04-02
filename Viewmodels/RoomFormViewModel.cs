using System.ComponentModel.DataAnnotations;

namespace newkaraoke.ViewModels;

public class RoomForm
{
    public int Id { get; set; }
    // ── ตรงกับ Room.RoomName ──
    [Required(ErrorMessage = "กรุณากรอกชื่อห้อง")]
    [Display(Name = "ชื่อห้อง")]
    public string RoomName { get; set; } = "";

    // ── ตรงกับ Room.Size ──
    [Required(ErrorMessage = "กรุณากรอกความจุ")]
    [Range(1, 50, ErrorMessage = "ความจุต้องอยู่ระหว่าง 1–50 คน")]
    [Display(Name = "ความจุสูงสุด (คน)")]
    public int Size { get; set; }

    // ── ตรงกับ Room.PricePerHour ──
    [Required(ErrorMessage = "กรุณากรอกราคา")]
    [Range(0, 100000, ErrorMessage = "ราคาต้องไม่ติดลบ")]
    [Display(Name = "ราคา/ชั่วโมง (฿)")]
    public decimal PricePerHour { get; set; }
    public IFormFile? Image { get; set; }
}
