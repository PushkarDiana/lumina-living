using System.ComponentModel.DataAnnotations;


namespace LuminaApi.Models
{
    public class Product
    {
        public int ProductID { get; set; }
        public int CategoryID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? OldPrice { get; set; }
        public string? Description { get; set; }
        public string ImageURL { get; set; } = string.Empty;
        public string? Badge { get; set; }
        public bool IsNew { get; set; }
        public bool IsActive { get; set; }
        public int StockQuantity { get; set; }

        public List<ProductAttribute> Attributes { get; set; } = new();
    }

    public class ProductAttribute
    {
        [Key]
        public int AttributeID { get; set; }
        public int ProductID { get; set; }
        public string AttributeName { get; set; } = string.Empty;
        public string AttributeValue { get; set; } = string.Empty;
    }
}