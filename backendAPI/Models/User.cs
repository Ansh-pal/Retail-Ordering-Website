namespace backendAPI.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string PhoneNo { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;

    // One user has one cart.
    public Cart? Cart { get; set; }

    // One user can place many orders.
    public List<Order> Orders { get; set; } = [];
}
