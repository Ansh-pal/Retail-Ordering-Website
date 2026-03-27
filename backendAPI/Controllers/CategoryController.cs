using backendAPI.Data;
using backendAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backendAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CategoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CategoryController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCategories()
    {
        var categories = await _context.Categories.ToListAsync();
        return Ok(categories);
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> AddCategory(AddCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Category name is required.");
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Name == request.Name);
        if (categoryExists)
        {
            return BadRequest("Category already exists.");
        }

        var category = new Category
        {
            Name = request.Name
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(category);
    }
}

public class AddCategoryRequest
{
    public string Name { get; set; } = string.Empty;
}
