using System;
using System.Collections.Generic;

namespace LuminaApi.DTOs
{
    // Главный класс-запрос, который прилетает с фронтенда при оформлении заказа
    public class OrderCreateDto
    {
        // Список товаров в корзине
        public List<OrderItemDto> Items { get; set; }

        // Общая сумма заказа
        public decimal TotalAmount { get; set; }

        // Дата и время создания заказа
        public DateTime CreatedAt { get; set; }

        // 📌 Новые поля для деталей доставки
        public string ShippingAddress { get; set; }
        public DateTime DeliveryDate { get; set; }
    }

    // Вспомогательный класс для описания каждого отдельного товара в заказе
    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}