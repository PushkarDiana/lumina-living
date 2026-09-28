const API_URL = 'https://localhost:7197/api/products';

let products = [];

async function loadProductsFromBackend() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        products = await response.json();
        console.log('Товары успешно загружены из MS SQL Server:', products);
        
        if (typeof window.initCatalogUI === 'function') {
            window.initCatalogUI();
        }

        if (typeof window.initProductDetailUI === 'function') {
            window.initProductDetailUI();
        }
    } catch (error) {
        console.error('Не удалось загрузить товары с C# API:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadProductsFromBackend);