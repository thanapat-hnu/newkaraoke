using System;
using System.Collections.Generic;

namespace newkaraoke.Models.db;

public partial class User
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;

    /// <summary>
    /// bcrypt hash only — never plain text
    /// </summary>
    public string Password { get; set; } = null!;

    public string Role { get; set; } = null!;

    public string? Phone { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual ICollection<Log> Logs { get; set; } = new List<Log>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();

    public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();
}
