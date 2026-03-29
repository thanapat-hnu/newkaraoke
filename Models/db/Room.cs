using System;
using System.Collections.Generic;

namespace newkaraoke.Models.db;

public partial class Room
{
    public int Id { get; set; }

    public string RoomName { get; set; } = null!;

    public int Size { get; set; }

    public decimal PricePerHour { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
