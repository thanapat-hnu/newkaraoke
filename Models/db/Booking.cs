using System;
using System.Collections.Generic;

namespace newkaraoke.Models.db;

public partial class Booking
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int RoomId { get; set; }

    public int? PromotionId { get; set; }

    public DateOnly BookingDate { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public decimal TotalPrice { get; set; }

    public string BookingCode { get; set; } = null!;

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Promotion? Promotion { get; set; }

    public virtual Room Room { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
