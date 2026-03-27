using System.Security.Claims;
using backendAPI.Data;
using backendAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backendAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "User")]
public class CartController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CartController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("add")]
    public async Task<IActionResult> AddToCart(AddCartItemRequest request)
    {
        if (request.ProductId <= 0 || request.Quantity <= 0)
        {
            return BadRequest("ProductId and Quantity must be greater than zero.");
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var cart = await _context.Carts
            .Include(c => c.CartItems)
            .FirstOrDefaultAsync(c => c.UserId == userId.Value);

        if (cart is null)
        {
            return NotFound("Cart not found for this user.");
        }

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId);
        if (product is null)
        {
            return NotFound("Product not found.");
        }

        if (!product.IsAvailable)
        {
            return BadRequest("Product is not available.");
        }

        var existingItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == request.ProductId);
        var requestedTotalQuantity = (existingItem?.Quantity ?? 0) + request.Quantity;

        if (product.Quantity < requestedTotalQuantity)
        {
            return BadRequest("Requested quantity exceeds available stock.");
        }

        if (existingItem is null)
        {
            cart.CartItems.Add(new CartItem
            {
                ProductId = request.ProductId,
                Quantity = request.Quantity
            });
        }
        else
        {
            existingItem.Quantity += request.Quantity;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Item added to cart." });
    }

    [HttpPut("update/{productId:int}")]
    public async Task<IActionResult> UpdateCartItem(int productId, UpdateCartItemRequest request)
    {
        if (productId <= 0 || request.Quantity <= 0)
        {
            return BadRequest("ProductId and Quantity must be greater than zero.");
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId.Value);
        if (cart is null)
        {
            return NotFound("Cart not found for this user.");
        }

        var cartItem = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == productId);

        if (cartItem is null)
        {
            return NotFound("Cart item not found.");
        }

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId);
        if (product is null)
        {
            return NotFound("Product not found.");
        }

        if (!product.IsAvailable)
        {
            return BadRequest("Product is not available.");
        }

        if (request.Quantity > product.Quantity)
        {
            return BadRequest("Requested quantity exceeds available stock.");
        }

        cartItem.Quantity = request.Quantity;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Cart item updated." });
    }

    [HttpDelete("remove/{productId:int}")]
    public async Task<IActionResult> RemoveFromCart(int productId)
    {
        if (productId <= 0)
        {
            return BadRequest("Invalid product id.");
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId.Value);
        if (cart is null)
        {
            return NotFound("Cart not found for this user.");
        }

        var cartItem = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == productId);

        if (cartItem is null)
        {
            return NotFound("Cart item not found.");
        }

        _context.CartItems.Remove(cartItem);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Item removed from cart." });
    }

    [HttpGet]
    public async Task<IActionResult> ViewCart()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var cart = await _context.Carts
            .Include(c => c.CartItems)
            .ThenInclude(ci => ci.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId.Value);

        if (cart is null)
        {
            return NotFound("Cart not found for this user.");
        }

        var response = new
        {
            cart.Id,
            cart.UserId,
            Items = cart.CartItems.Select(ci => new
            {
                ci.ProductId,
                ProductName = ci.Product != null ? ci.Product.Name : string.Empty,
                ci.Quantity,
                Price = ci.Product != null ? ci.Product.Price : 0
            })
        };

        return Ok(response);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }

        return null;
    }
}

public class AddCartItemRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateCartItemRequest
{
    public int Quantity { get; set; }
}

