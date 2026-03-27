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
public class OrderController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrderController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("place")]
    public async Task<IActionResult> PlaceOrder()
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

        if (cart.CartItems.Count == 0)
        {
            return BadRequest("Cart is empty.");
        }

        foreach (var item in cart.CartItems)
        {
            if (item.Product is null)
            {
                return NotFound("One or more products were not found.");
            }

            if (!item.Product.IsAvailable)
            {
                return BadRequest($"Product '{item.Product.Name}' is not available.");
            }

            if (item.Quantity > item.Product.Quantity)
            {
                return BadRequest($"Insufficient stock for product '{item.Product.Name}'.");
            }
        }

        var order = new Order
        {
            UserId = userId.Value,
            CreatedAt = DateTime.UtcNow,
            Status = "Placed",
            TotalAmount = 0
        };

        foreach (var item in cart.CartItems)
        {
            var product = item.Product!;
            order.OrderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                Price = product.Price
            });

            order.TotalAmount += product.Price * item.Quantity;
            product.Quantity -= item.Quantity;
            if (product.Quantity == 0)
            {
                product.IsAvailable = false;
            }
        }

        _context.Orders.Add(order);
        _context.CartItems.RemoveRange(cart.CartItems);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Order placed successfully.",
            order.Id,
            order.TotalAmount,
            order.Status,
            order.CreatedAt
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var orders = await _context.Orders
            .Where(o => o.UserId == userId.Value)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.TotalAmount,
                o.Status,
                o.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{orderId:int}")]
    public async Task<IActionResult> GetOrderById(int orderId)
    {
        if (orderId <= 0)
        {
            return BadRequest("Invalid order id.");
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var order = await _context.Orders
            .Where(o => o.Id == orderId && o.UserId == userId.Value)
            .Select(o => new
            {
                o.Id,
                o.UserId,
                o.TotalAmount,
                o.Status,
                o.CreatedAt,
                Items = o.OrderItems.Select(oi => new
                {
                    oi.Id,
                    oi.ProductId,
                    ProductName = oi.Product != null ? oi.Product.Name : string.Empty,
                    oi.Quantity,
                    oi.Price
                })
            })
            .FirstOrDefaultAsync();

        if (order is null)
        {
            return NotFound("Order not found.");
        }

        return Ok(order);
    }

    [HttpGet("{orderId:int}/items")]
    public async Task<IActionResult> GetOrderItems(int orderId)
    {
        if (orderId <= 0)
        {
            return BadRequest("Invalid order id.");
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var orderExists = await _context.Orders.AnyAsync(o => o.Id == orderId && o.UserId == userId.Value);
        if (!orderExists)
        {
            return NotFound("Order not found.");
        }

        var items = await _context.OrderItems
            .Where(oi => oi.OrderId == orderId)
            .Select(oi => new
            {
                oi.Id,
                oi.OrderId,
                oi.ProductId,
                ProductName = oi.Product != null ? oi.Product.Name : string.Empty,
                oi.Quantity,
                oi.Price
            })
            .ToListAsync();

        return Ok(items);
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
