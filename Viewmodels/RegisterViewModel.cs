namespace newkaraoke.ViewModels;

public partial class Register
{
    // public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Password { get; set; } = null!;

    // public string Role { get; set; } = null!;

    public string? ProfileImg { get; set; }

    public string? Phone { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

}
