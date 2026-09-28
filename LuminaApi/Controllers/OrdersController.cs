using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuminaApi.Data;
using LuminaApi.DTOs;
using LuminaApi.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic; 

namespace LuminaApi.Controllers
{
    [Route("api/orders")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // --- СЮДА ВСТАВЛЯЕМ НОВЫЙ ВАРИАНТ МЕТОДА GET ---
        // GET: api/orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product) // <--- ОБЯЗАТЕЛЬНО: подгружаем сам продукт со всеми полями (Name, Price, ImageUrl)
                .ToListAsync();
        }

        // POST: api/orders (остается без изменений)
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto orderDto)
        {
            if (orderDto == null || orderDto.Items == null || !orderDto.Items.Any())
            {
                return BadRequest(new { message = "Корзина пуста или переданы некорректные данные." });
            }

            try
            {
                var order = new Order
                {
                    CreatedAt = orderDto.CreatedAt == default ? DateTime.Now : orderDto.CreatedAt,
                    TotalAmount = orderDto.TotalAmount,
                    Status = "Новый",
                    ShippingAddress = orderDto.ShippingAddress,
                    DeliveryDate = orderDto.DeliveryDate,

                    OrderItems = orderDto.Items.Select(itemDto => new OrderItem
                    {
                        ProductId = itemDto.ProductId,
                        Quantity = itemDto.Quantity,
                        Price = itemDto.Price
                    }).ToList()
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                return StatusCode(201, new
                {
                    message = "Заказ успешно создан и сохранен в базе данных!",
                    orderId = order.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Произошла ошибка при сохранении заказа на сервере.",
                    error = ex.Message
                });
            }
        }
    }
}