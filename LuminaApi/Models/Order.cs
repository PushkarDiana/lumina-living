using System;
using System.Collections.Generic;

namespace LuminaApi.Models
{
    public class Order
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Новый";

        public string ShippingAddress { get; set; }
        public DateTime DeliveryDate { get; set; }

        // Связь один-к-многим с позициями заказа
        public List<OrderItem> OrderItems { get; set; } = new();
    }
}