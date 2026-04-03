using System.ComponentModel.DataAnnotations;

namespace newkaraoke.ViewModels;

public class PromotionForm
{
    [Required(ErrorMessage = "กรุณากรอกชื่อโปรโมชั่น")]
    [Display(Name = "ชื่อโปรโมชั่น")]
    public string Name { get; set; } = "";

    [Display(Name = "คำอธิบาย")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "กรุณาเลือกประเภทส่วนลด")]
    [Display(Name = "ประเภทส่วนลด")]
    public string DiscountType { get; set; } = "percent";

    [Required(ErrorMessage = "กรุณากรอกค่าส่วนลด")]
    [Range(0.01, double.MaxValue, ErrorMessage = "ค่าส่วนลดต้องมากกว่า 0")]
    [Display(Name = "ค่าส่วนลด")]
    public decimal Value { get; set; }

    [Display(Name = "เงื่อนไข")]
    public string? Condition { get; set; }

    [Required(ErrorMessage = "กรุณาเลือกวันเริ่ม")]
    [Display(Name = "วันเริ่ม")]
    public DateOnly StartDate { get; set; } = DateOnly.FromDateTime(DateTime.Today);

    [Required(ErrorMessage = "กรุณาเลือกวันหมดอายุ")]
    [Display(Name = "วันหมดอายุ")]
    public DateOnly EndDate { get; set; } = DateOnly.FromDateTime(DateTime.Today.AddDays(30));

    [Range(1, int.MaxValue, ErrorMessage = "จำนวนต้องมากกว่า 0")]
    [Display(Name = "จำนวนครั้งที่ใช้ได้")]
    public int? UsageLimit { get; set; }  // null = ไม่จำกัด

    [Display(Name = "เปิดใช้งาน")]
    public bool IsActive { get; set; } = true;
}
