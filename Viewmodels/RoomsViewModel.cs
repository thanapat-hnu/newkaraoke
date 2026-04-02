namespace newkaraoke.ViewModels;

public class Rooms
{
    public int Id { get; set; }

    public string RoomName { get; set; } = null!;

    public int Size { get; set; }

    public decimal PricePerHour { get; set; }

    public bool IsConfirmed { get; set; } = false;

    public int ActiveBookings { get; set; } = 0;


    // public DateTime? CreatedAt { get; set; }

    // public DateTime? UpdatedAt { get; set; }

    // public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
