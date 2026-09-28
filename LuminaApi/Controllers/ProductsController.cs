using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuminaApi.Data;

namespace LuminaApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Наш эндпоинт будет доступен по адресу: api/products
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/products — получить все активные товары из MS SQL
        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            // 1. Загружаем товары и их атрибуты из базы MS SQL
            var dbProducts = await _context.Products
                .Include(p => p.Attributes)
                .Where(p => p.IsActive)
                .ToListAsync();

            // 2. Преобразуем атрибуты в словарь уже в памяти
            var result = dbProducts.Select(p => new
            {
                id = p.ProductID,
                title = p.Title,
                sku = p.SKU,
                price = p.Price,
                oldPrice = p.OldPrice,
                badge = p.Badge,
                isNew = p.IsNew,
                image = p.ImageURL,
                description = p.Description,
                specs = p.Attributes.ToDictionary(a => a.AttributeName, a => a.AttributeValue)
            });

            return Ok(result);
        }
    }
}