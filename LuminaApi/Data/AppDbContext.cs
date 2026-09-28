using Microsoft.EntityFrameworkCore;
using LuminaApi.Models;

namespace LuminaApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Product> Products { get; set; }
        public DbSet<ProductAttribute> ProductAttributes { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Настройки для товаров и атрибутов
            modelBuilder.Entity<Product>()
                .HasKey(p => p.ProductID);

            modelBuilder.Entity<ProductAttribute>()
                .HasKey(pa => pa.AttributeID);

            modelBuilder.Entity<Product>()
                .HasMany(p => p.Attributes)
                .WithOne()
                .HasForeignKey(pa => pa.ProductID);

            // --- ДОБАВЛЯЕМ УНИКАЛЬНЫЙ ИНДЕКС ДЛЯ EMAIL ПОЛЬЗОВАТЕЛЯ ---
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            base.OnModelCreating(modelBuilder);
        }
    }
}