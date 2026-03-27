namespace backendAPI.Models;

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }

    // One order has many order items.
    public List<OrderItem> OrderItems { get; set; } = [];
}
