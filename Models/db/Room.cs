using System;
using System.Collections.Generic;

namespace newkaraoke.Models.db;

public partial class Room
{
    public int Id { get; set; }

    /// <summary>
    /// Staff who created this room
    /// </summary>
    public int CreatedBy { get; set; }

    public string RoomName { get; set; } = null!;

    public int Size { get; set; }

    public decimal PricePerHour { get; set; }

    /// <summary>
    /// Main cover image
    /// </summary>
    public string? ImageUrl { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual User CreatedByNavigation { get; set; } = null!;
}
