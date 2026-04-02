namespace newkaraoke.ViewModels;

public class Rooms
{
    public int Id { get; set; }
    public string RoomName { get; set; } = null!;
    public int Size { get; set; }
    public decimal PricePerHour { get; set; }
    public bool? IsActive { get; set; } = true;
    public int ActiveBookings { get; set; } = 0;
    public string? ImageUrl { get; set; }
}