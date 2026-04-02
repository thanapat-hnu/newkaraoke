using System;
using System.Collections.Generic;

namespace newkaraoke.Models.db;

public partial class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? BookingId { get; set; }

    public string Type { get; set; } = null!;

    public string Channel { get; set; } = null!;

    public string? Status { get; set; }

    public DateTime? SentAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Booking? Booking { get; set; }

    public virtual User User { get; set; } = null!;
}
