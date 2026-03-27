namespace backendAPI.Models;

public class Cart
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public User? User { get; set; }

    // One cart has many cart items.
    public List<CartItem> CartItems { get; set; } = [];
}