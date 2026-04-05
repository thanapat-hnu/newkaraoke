namespace newkaraoke.ViewModels;

public class StaffBookingRow
{
    public string Code            { get; set; } = "";
    public string UserName        { get; set; } = "";
    public string UserEmail       { get; set; } = "";
    public string RoomName        { get; set; } = "";
    public string DateDisplay     { get; set; } = "";
    public string StartTime       { get; set; } = "";
    public string EndTime         { get; set; } = "";
    public decimal Total          { get; set; }
    public string Status          { get; set; } = "";
}
