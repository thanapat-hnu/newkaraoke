namespace newkaraoke.ViewModels;

// ── หน้า Booking (Step 1-4) ────────────────────────────
public class BookingPageViewModel
{
    public List<RoomSelectDto> Rooms { get; set; } = new();

    // ค่าที่ผู้ใช้เลือกไว้ (ส่งกลับมาตอน validation fail)
    public string? SelectedDate   { get; set; }
    public int     People         { get; set; } = 2;
    public int?    SelectedRoomId { get; set; }
    public string? SelectedStart  { get; set; }
    public string? SelectedEnd    { get; set; }
    public string? Error          { get; set; }
}

public class RoomSelectDto
{
    public int     Id           { get; set; }
    public string  RoomName     { get; set; } = "";
    public int     Size         { get; set; }
    public decimal PricePerHour { get; set; }
    public string? ImageUrl     { get; set; }
}

// ── Form POST จาก Step 1-4 ─────────────────────────────
public class BookingStepForm
{
    public string Date      { get; set; } = "";
    public int    People    { get; set; } = 2;
    public int    RoomId    { get; set; }
    public string StartTime { get; set; } = "";
    public string EndTime   { get; set; } = "";
}

// ── หน้า BookingConfirm (Step 5) ──────────────────────
public class BookingConfirmViewModel
{
    public string  RoomName    { get; set; } = "";
    public string  DateDisplay { get; set; } = "";
    public string  TimeDisplay { get; set; } = "";
    public double  Hours       { get; set; }
    public int     People      { get; set; }
    public decimal BasePrice   { get; set; }
    public decimal TotalPrice  { get; set; }

    // Promo
    public string? PromoCode    { get; set; }
    public string? PromoMessage { get; set; }
    public bool    PromoValid   { get; set; }
    public decimal Discount     { get; set; }

    // Raw values สำหรับ submit ต่อ
    public string Date      { get; set; } = "";
    public int    RoomId    { get; set; }
    public string StartTime { get; set; } = "";
    public string EndTime   { get; set; } = "";
    public int    PeopleCount { get; set; }
}

// ── Form ชำระเงิน ──────────────────────────────────────
public class BookingPayForm
{
    public int     RoomId    { get; set; }
    public string  Date      { get; set; } = "";
    public string  StartTime { get; set; } = "";
    public string  EndTime   { get; set; } = "";
    public int     People    { get; set; }
    public string  PayMethod { get; set; } = "counter";
    public string? PromoCode { get; set; }
}

// ── หน้า BookingSuccess ────────────────────────────────
public class BookingSuccessViewModel
{
    public string  BookingCode { get; set; } = "";
    public string  RoomName    { get; set; } = "";
    public string  DateDisplay { get; set; } = "";
    public string  TimeDisplay { get; set; } = "";
    public decimal TotalPrice  { get; set; }
    public string  PayMethod   { get; set; } = "";
    public string  Status      { get; set; } = "";
}

// ── PromoDto (สำหรับ JS) ───────────────────────────────
public class PromoDto
{
    public int     Id           { get; set; }
    public string  Name         { get; set; } = "";
    public string  DiscountType { get; set; } = "";
    public decimal Value        { get; set; }
    public int?    UsageLimit   { get; set; }
    public int?    UsedCount    { get; set; }
}

// ── Promo Check ────────────────────────────────────────
public class PromoCheckDto
{
    public bool    Valid        { get; set; }
    public string? Message      { get; set; }
    public string  DiscountType { get; set; } = "";
    public decimal Value        { get; set; }
    public int?    PromoId      { get; set; }
}

// ── Booking Result (legacy) ────────────────────────────
public class BookingResultDto
{
    public bool    Success     { get; set; }
    public string? BookingCode { get; set; }
    public string? Message     { get; set; }
    public decimal TotalPrice  { get; set; }
}

// ── BookingRowDto (Profile) ────────────────────────────
public class BookingRowDto
{
    public string  Code       { get; set; } = "";
    public string  RoomName   { get; set; } = "";
    public string  Date       { get; set; } = "";
    public string  Time       { get; set; } = "";
    public decimal TotalPrice { get; set; }
    public string? Status     { get; set; }
}
