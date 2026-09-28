-- ============================================================================
-- БАЗА ДАННЫХ ИНТЕРНЕТ-МАГАЗИНА LUMINA LIVING (PRODUCTION GRADE)
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'LuminaDB')
BEGIN
    CREATE DATABASE LuminaDB;
END
GO

USE LuminaDB;
GO

-- ----------------------------------------------------------------------------
-- 1. Справочник категорий товаров
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
CREATE TABLE dbo.Categories (
    CategoryID INT IDENTITY(1,1) NOT NULL,
    CategoryName NVARCHAR(100) NOT NULL,
    Slug VARCHAR(50) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    
    CONSTRAINT PK_Categories PRIMARY KEY CLUSTERED (CategoryID),
    CONSTRAINT UQ_Categories_Slug UNIQUE (Slug)
);

-- ----------------------------------------------------------------------------
-- 2. Каталог товаров
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
CREATE TABLE dbo.Products (
    ProductID INT IDENTITY(1,1) NOT NULL,
    CategoryID INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    SKU VARCHAR(50) NOT NULL, -- Артикул товара (обязателен в ритейле)
    Price DECIMAL(12,2) NOT NULL,
    OldPrice DECIMAL(12,2) NULL,
    Description NVARCHAR(MAX) NULL,
    ImageURL NVARCHAR(500) NOT NULL,
    Badge NVARCHAR(50) NULL, -- 'Hit', 'New', 'Sale'
    IsNew BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    StockQuantity INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_Products PRIMARY KEY CLUSTERED (ProductID),
    CONSTRAINT UQ_Products_SKU UNIQUE (SKU),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryID) REFERENCES dbo.Categories(CategoryID),
    CONSTRAINT CHK_Products_Price CHECK (Price >= 0),
    CONSTRAINT CHK_Products_OldPrice CHECK (OldPrice IS NULL OR OldPrice > Price),
    CONSTRAINT CHK_Products_Stock CHECK (StockQuantity >= 0)
);

-- Индекс для фильтрации и поиска товаров по категории и статусу
CREATE NONCLUSTERED INDEX IX_Products_CategoryID_IsActive 
ON dbo.Products (CategoryID, IsActive) 
INCLUDE (Title, Price, ImageURL, Badge);

-- ----------------------------------------------------------------------------
-- 3. Характеристики товаров (Specs) - Динамические атрибуты
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.ProductAttributes', 'U') IS NOT NULL DROP TABLE dbo.ProductAttributes;
CREATE TABLE dbo.ProductAttributes (
    AttributeID INT IDENTITY(1,1) NOT NULL,
    ProductID INT NOT NULL,
    AttributeName NVARCHAR(100) NOT NULL,  -- Например: "Материал", "Габариты", "Страна"
    AttributeValue NVARCHAR(255) NOT NULL, -- Например: "Массив дуба", "85 × 78 × 92 см"

    CONSTRAINT PK_ProductAttributes PRIMARY KEY CLUSTERED (AttributeID),
    CONSTRAINT FK_ProductAttributes_Products FOREIGN KEY (ProductID) 
        REFERENCES dbo.Products(ProductID) ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX IX_ProductAttributes_ProductID 
ON dbo.ProductAttributes (ProductID);

-- ----------------------------------------------------------------------------
-- 4. Статусы заказов (Справочник)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.OrderStatuses', 'U') IS NOT NULL DROP TABLE dbo.OrderStatuses;
CREATE TABLE dbo.OrderStatuses (
    StatusID INT IDENTITY(1,1) NOT NULL,
    StatusName NVARCHAR(50) NOT NULL, -- 'Новый', 'Ожидает оплаты', 'Оплачен', 'В доставке', 'Завершен', 'Отменен'
    
    CONSTRAINT PK_OrderStatuses PRIMARY KEY CLUSTERED (StatusID)
);

-- ----------------------------------------------------------------------------
-- 5. Заказы покупателей
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
CREATE TABLE dbo.Orders (
    OrderID INT IDENTITY(1,1) NOT NULL,
    OrderNumber VARCHAR(20) NOT NULL, -- Уникальный публичный номер (напр. LUM-2026-0001)
    StatusID INT NOT NULL DEFAULT 1,
    
    -- Данные клиента
    CustomerName NVARCHAR(100) NOT NULL,
    CustomerPhone VARCHAR(20) NOT NULL,
    CustomerEmail NVARCHAR(100) NULL,
    DeliveryAddress NVARCHAR(500) NULL,
    CustomerComment NVARCHAR(1000) NULL,

    -- Финансы
    TotalAmount DECIMAL(12,2) NOT NULL,
    PaymentTransactionID VARCHAR(100) NULL, -- ID платежа из ЮKassa / T-Bank
    
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_Orders PRIMARY KEY CLUSTERED (OrderID),
    CONSTRAINT UQ_Orders_OrderNumber UNIQUE (OrderNumber),
    CONSTRAINT FK_Orders_OrderStatuses FOREIGN KEY (StatusID) REFERENCES dbo.OrderStatuses(StatusID),
    CONSTRAINT CHK_Orders_TotalAmount CHECK (TotalAmount >= 0)
);

-- ----------------------------------------------------------------------------
-- 6. Позиции заказа (Order Items)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DROP TABLE dbo.OrderItems;
CREATE TABLE dbo.OrderItems (
    OrderItemID INT IDENTITY(1,1) NOT NULL,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    UnitPrice DECIMAL(12,2) NOT NULL, -- Фиксируем цену на момент покупки!
    Quantity INT NOT NULL,
    TotalPrice AS (UnitPrice * Quantity) PERSISTED, -- Вычисляемое поле

    CONSTRAINT PK_OrderItems PRIMARY KEY CLUSTERED (OrderItemID),
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderID) REFERENCES dbo.Orders(OrderID) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductID) REFERENCES dbo.Products(ProductID),
    CONSTRAINT CHK_OrderItems_Quantity CHECK (Quantity > 0)
);

-- ----------------------------------------------------------------------------
-- 7. Заявки с формы «Контакты & Консультация»
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.ContactRequests', 'U') IS NOT NULL DROP TABLE dbo.ContactRequests;
CREATE TABLE dbo.ContactRequests (
    RequestID INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Message NVARCHAR(MAX) NULL,
    IsProcessed BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_ContactRequests PRIMARY KEY CLUSTERED (RequestID)
);
GO

-- 1. Справочники
INSERT INTO dbo.OrderStatuses (StatusName) VALUES 
(N'Новый'), (N'Ожидает оплаты'), (N'Оплачен'), (N'В доставке'), (N'Завершен'), (N'Отменен');

INSERT INTO dbo.Categories (CategoryName, Slug) VALUES 
(N'Мебель', 'sofas'),
(N'Освещение', 'lighting'),
(N'Столы', 'tables'),
(N'Декор', 'decor');
GO

-- 2. Вспомогательная процедура добавления товара с деталями
CREATE OR ALTER PROCEDURE dbo.sp_AddProductWithSpecs
    @CategorySlug VARCHAR(50),
    @Title NVARCHAR(255),
    @SKU VARCHAR(50),
    @Price DECIMAL(12,2),
    @OldPrice DECIMAL(12,2),
    @Badge NVARCHAR(50),
    @IsNew BIT,
    @ImageURL NVARCHAR(500),
    @Description NVARCHAR(MAX),
    @Material NVARCHAR(255),
    @Dimensions NVARCHAR(255),
    @Weight NVARCHAR(255),
    @Color NVARCHAR(255),
    @Warranty NVARCHAR(255),
    @Country NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CatID INT = (SELECT CategoryID FROM dbo.Categories WHERE Slug = @CategorySlug);
    DECLARE @NewProdID INT;

    INSERT INTO dbo.Products (CategoryID, Title, SKU, Price, OldPrice, Badge, IsNew, ImageURL, Description, StockQuantity)
    VALUES (@CatID, @Title, @SKU, @Price, @OldPrice, @Badge, @IsNew, @ImageURL, @Description, 15);

    SET @NewProdID = SCOPE_IDENTITY();

    -- Характеристики
    IF @Material IS NOT NULL INSERT INTO dbo.ProductAttributes VALUES (@NewProdID, N'Материал', @Material);
    IF @Dimensions IS NOT NULL INSERT INTO dbo.ProductAttributes VALUES (@NewProdID, N'Габариты', @Dimensions);
    IF @Weight IS NOT NULL INSERT INTO dbo.ProductAttributes VALUES (@NewProdID, N'Вес', @Weight);
    IF @Color IS NOT NULL INSERT INTO dbo.ProductAttributes VALUES (@NewProdID, N'Цвет', @Color);
    IF @Warranty IS NOT NULL INSERT INTO dbo.ProductAttributes VALUES (@NewProdID, N'Гарантия', @Warranty);
    IF @Country IS NOT NULL INSERT INTO dbo.ProductAttributes VALUES (@NewProdID, N'Страна производства', @Country);
END;
GO

-- 3. Импорт 12 товаров
EXEC dbo.sp_AddProductWithSpecs 'sofas', N'Кресло Velour Minimal', 'LUM-CH-001', 34900, 41000, N'Hit', 0, 'image/Кресло Velour Minimal.jpg', N'Премиальное дизайнерское кресло с обивкой из износостойкого велюра.', N'Массив дуба, велюр', N'85 × 78 × 92 см', N'18 кг', N'Изумрудно-зеленый', N'24 месяца', N'Швеция';
EXEC dbo.sp_AddProductWithSpecs 'lighting', N'Торшер Brass Arc', 'LUM-LT-002', 18500, NULL, N'New', 1, 'image/Торшер Brass Arc.jpg', N'Элегантный напольный светильник с изогнутой латунной стойкой.', N'Латунь, мраморное основание', N'40 × 120 × 210 см', N'12 кг', N'Матовая латунь', N'12 месяцев', N'Италия';
EXEC dbo.sp_AddProductWithSpecs 'tables', N'Обеденный стол Oak Craft', 'LUM-TB-003', 62000, 72000, N'-14%', 0, 'image/Обеденный стол Oak Craft.jpg', N'Массивный обеденный стол из натурального дуба с выразительной текстурой.', N'100% массив дуба', N'200 × 90 × 76 см', N'54 кг', N'Натуральный дуб', N'36 месяцев', N'Дания';
EXEC dbo.sp_AddProductWithSpecs 'decor', N'Ваза Ceramica Studio', 'LUM-DC-004', 4900, NULL, NULL, 1, 'image/Ваза Ceramica Studio.jpg', N'Керамическая ваза ручной работы с фактурной матовой поверхностью.', N'Шамотная глина, матовая глазурь', N'18 × 18 × 32 см', N'2.4 кг', N'Песочный / Терракот', N'12 месяцев', N'Португалия';
EXEC dbo.sp_AddProductWithSpecs 'sofas', N'Диван Boucle Nordic', 'LUM-SF-005', 89900, 98000, N'Hit', 0, 'image/Диван Boucle Nordic.jpg', N'Трехместный диван в трендовой обивке из букле.', N'Ткань букле, березовый фанерный каркас', N'220 × 98 × 82 см', N'62 кг', N'Молочный', N'36 месяцев', N'Финляндия';
EXEC dbo.sp_AddProductWithSpecs 'lighting', N'Подвесной светильник Globe', 'LUM-LT-006', 12400, NULL, NULL, 0, 'image/Подвесной светильник Globe.jpg', N'Лаконичный светильник из матового стекла в форме сферы.', N'Матовое стекло, анодированный алюминий', N'30 × 30 × 150 см', N'3.1 кг', N'Белый матовый / Черный', N'24 месяца', N'Германия';
EXEC dbo.sp_AddProductWithSpecs 'tables', N'Журнальный стол Walnut Oval', 'LUM-TB-007', 24500, 28000, N'Sale', 0, 'image/Журнальный стол Walnut Oval.jpg', N'Изящный овальный столик из шпона американского ореха.', N'Шпон американского ореха, МДФ', N'110 × 60 × 42 см', N'14 кг', N'Темный орех', N'24 месяца', N'Польша';
EXEC dbo.sp_AddProductWithSpecs 'decor', N'Ароматическая свеча Sandalwood', 'LUM-DC-008', 2900, NULL, N'New', 1, 'image/Ароматическая свеча Sandalwood.jpg', N'Ароматическая свеча из соевого воска в подсвечнике из темного стекла.', N'100% соевый воск, деревянный фитиль', N'9 × 9 × 10 см', N'0.6 кг', N'Янтарный', N'6 месяцев', N'Франция';
EXEC dbo.sp_AddProductWithSpecs 'sofas', N'Кресло-лаунж Linen Comfort', 'LUM-SF-009', 42000, NULL, NULL, 0, 'image/Кресло-лаунж Linen Comfort.jpg', N'Просторное лаунж-кресло с чехлом из натурального льна.', N'Натуральный лен, массив ясеня', N'90 × 85 × 88 см', N'22 кг', N'Бежевый натуральный', N'24 месяца', N'Швеция';
EXEC dbo.sp_AddProductWithSpecs 'lighting', N'Настольная лампа Concrete Base', 'LUM-LT-010', 9800, 11500, N'-15%', 0, 'image/Настольная лампа Concrete Base.jpg', N'Настольный светильник в стиле лофт с тяжелым основанием из бетона.', N'Архитектурный бетон, льняной абажур', N'25 × 25 × 45 см', N'4.5 кг', N'Серый бетон / Бежевый', N'12 месяцев', N'Нидерланды';
EXEC dbo.sp_AddProductWithSpecs 'decor', N'Настенное зеркало Geo Brass', 'LUM-DC-011', 15400, NULL, N'Hit', 1, 'image/Настенное зеркало Geo Brass.jpg', N'Декоративное настенное зеркало асимметричной формы в латунной раме.', N'Зеркальное полотно, латунный профиль', N'70 × 90 × 2 см', N'6.8 кг', N'Золотистая латунь', N'12 месяцев', N'Испания';
EXEC dbo.sp_AddProductWithSpecs 'tables', N'Рабочий стол Minimal Desk', 'LUM-TB-012', 45000, NULL, NULL, 0, 'image/Рабочий стол Minimal Desk.jpg', N'Минималистичный письменный стол с выдвижным ящиком.', N'Массив ясеня, стальное основание', N'140 × 65 × 75 см', N'28 кг', N'Светлый ясень / Черная сталь', N'36 месяцев', N'Германия';
GO

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(MAX) NOT NULL,
        FullName NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'Phone')
BEGIN
    ALTER TABLE dbo.Users ADD Phone NVARCHAR(20) NULL;
END
GO

-- Добавляем колонку для адреса доставки
ALTER TABLE Orders 
ADD ShippingAddress NVARCHAR(500) NULL;

-- Добавляем колонку для даты доставки
ALTER TABLE Orders 
ADD DeliveryDate DATE NULL;