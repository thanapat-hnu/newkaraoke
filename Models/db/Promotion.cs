using System;
using System.Collections.Generic;

namespace newkaraoke.Models.db;

public partial class Promotion
{
    public int Id { get; set; }

    /// <summary>
    /// Staff who created this promotion
    /// </summary>
    public int CreatedBy { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string DiscountType { get; set; } = null!;

    public decimal Value { get; set; }

    public string? Condition { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    /// <summary>
    /// NULL = unlimited
    /// </summary>
    public int? UsageLimit { get; set; }

    public int? UsedCount { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual User CreatedByNavigation { get; set; } = null!;
}
