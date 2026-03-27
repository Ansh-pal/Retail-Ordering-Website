namespace backendAPI.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // One category has many products.
    public List<Product> Products { get; set; } = [];
}