using backendAPI.Data;
using backendAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backendAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProductController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "User,Manager")]
    public async Task<IActionResult> GetAllProducts()
    {
        var products = await _context.Products
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Price,
                p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                p.Quantity,
                p.IsAvailable
            })
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("category/{categoryId:int}")]
    [Authorize(Roles = "User,Manager")]
    public async Task<IActionResult> GetProductsByCategory(int categoryId)
    {
        if (categoryId <= 0)
        {
            return BadRequest("Invalid category id.");
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == categoryId);
        if (!categoryExists)
        {
            return NotFound("Category not found.");
        }

        var products = await _context.Products
            .Where(p => p.CategoryId == categoryId)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Price,
                p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                p.Quantity,
                p.IsAvailable
            })
            .ToListAsync();

        return Ok(products);
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> AddProduct(AddProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Price <= 0 || request.Quantity < 0 || request.CategoryId <= 0)
        {
            return BadRequest("Invalid product data.");
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return NotFound("Category not found.");
        }

        var product = new Product
        {
            Name = request.Name,
            Price = request.Price,
            CategoryId = request.CategoryId,
            Quantity = request.Quantity,
            IsAvailable = request.IsAvailable
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return Ok(product);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is null)
        {
            return NotFound("Product not found.");
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Product deleted successfully." });
    }
}

public class AddProductRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
    public int Quantity { get; set; }
    public bool IsAvailable { get; set; }
}
