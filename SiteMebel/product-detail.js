document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  // Функция восстановления корректного пути к картинке
  const fixImagePath = (imagePath, title) => {
    if (!imagePath) return 'image/placeholder.jpg';
    try {
      let decoded = decodeURIComponent(imagePath);
      if (decoded.includes('?') && title) {
        return `image/${title}.jpg`;
      }
      return decoded;
    } catch (e) {
      return imagePath;
    }
  };

  const formatPrice = (price) => price ? price.toLocaleString('ru-RU') + ' ₽' : '0 ₽';

  // Главная функция отрисовки 
  window.initProductDetailUI = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = Number(urlParams.get('id'));

    if (typeof products === 'undefined' || !products.length) {
      container.innerHTML = `<h2>Ошибка загрузки данных</h2><a href="index.html" class="btn btn--primary">Вернуться в каталог</a>`;
      return;
    }

    const product = products.find(p => p.id === productId);

    if (!product) {
      container.innerHTML = `<h2>Товар не найден</h2><a href="index.html" class="btn btn--primary">Вернуться в каталог</a>`;
      return;
    }

    document.title = `${product.title} — Lumina Living`;

    // Отзывы из localStorage
    let reviews = JSON.parse(localStorage.getItem(`reviews_prod_${product.id}`)) || [
      { name: "Анна М.", date: "10.09.2026", rating: 5, text: "Прекрасное качество! Идеально вписалось в интерьер, доставка аккуратная." },
      { name: "Дмитрий K.", date: "02.09.2026", rating: 5, text: "Материалы приятные на ощупь. Сборка заняла всего 15 минут." }
    ];

    // Похожие товары
    const relatedProducts = products
      .filter(p => p.id !== product.id)
      .slice(0, 4);

    container.innerHTML = `
      <div class="product-detail__grid">
        <div class="product-detail__gallery">
          <img src="${fixImagePath(product.image, product.title)}" alt="${product.title}" class="product-detail__main-img">
        </div>

        <div class="product-detail__info">
          <div class="product-detail__header-actions">
            <span class="product-detail__category">${product.categoryName || ''}</span>
            <button class="share-btn" id="share-btn" title="Поделиться"><i class="fa-solid fa-share-nodes"></i> Поделиться</button>
          </div>

          <h1 class="product-detail__title">${product.title}</h1>
          
          <div class="product-detail__price-box">
            <span class="product-detail__price">${formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="product-detail__price-old">${formatPrice(product.oldPrice)}</span>` : ''}
          </div>

          <p class="product-detail__description">${product.description || 'Описание временно отсутствует.'}</p>

          <div class="product-detail__actions">
            <button class="btn btn--primary add-to-cart-btn" data-id="${product.id}">
              <i class="fa-solid fa-bag-shopping"></i> Добавить в корзину
            </button>

          <div class="product-info-accordion">
            <div class="accordion-item">
              <div class="accordion-header"><i class="fa-solid fa-truck-fast"></i> Доставка и Подъем</div>
              <div class="accordion-body">Доставка по городу — <b>500 ₽</b> (бесплатно при заказе от 50 000 ₽). Подъем на этаж на лифте — бесплатно.</div>
            </div>
            <div class="accordion-item">
              <div class="accordion-header"><i class="fa-solid fa-screwdriver-wrench"></i> Сборка и Монтаж</div>
              <div class="accordion-body">Профессиональная сборка в день доставки — <b>10% от стоимости товара</b> (но не менее 1 500 ₽).</div>
            </div>
            <div class="accordion-item">
              <div class="accordion-header"><i class="fa-solid fa-shield-halved"></i> Гарантия и Возврат</div>
              <div class="accordion-body">Официальная гарантия <b>24 месяца</b>. Возврат или обмен товара надлежащего качества в течение 14 дней.</div>
            </div>
          </div>

          <!-- Характеристики из базы MS SQL -->
          <div class="product-detail__specs">
            <h3>Характеристики</h3>
            <table class="specs-table">
              ${product.specs && Object.keys(product.specs).length > 0 ? Object.entries(product.specs).map(([key, value]) => {
                return `<tr><td>${key}</td><td>${value}</td></tr>`;
              }).join('') : '<tr><td>Характеристики уточняются</td></tr>'}
            </table>
          </div>
        </div>
      </div>

      <!-- Отзывы -->
      <section class="reviews-section">
        <h2 class="section-title">Отзывы покупателей (${reviews.length})</h2>
        <div class="reviews-container">
          <div class="reviews-list">
            ${reviews.map(r => `
              <div class="review-card">
                <div class="review-card__header">
                  <strong>${r.name}</strong>
                  <span class="review-card__date">${r.date}</span>
                </div>
                <div class="review-card__stars">
                  ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                </div>
                <p class="review-card__text">${r.text}</p>
              </div>
            `).join('')}
          </div>

          <form class="review-form" id="review-form">
            <h3>Оставить отзыв</h3>
            <input type="text" id="review-author" placeholder="Ваше имя" required>
            <select id="review-rating" required>
              <option value="5">Оценка: 5 из 5 (Отлично)</option>
              <option value="4">Оценка: 4 из 5 (Хорошо)</option>
              <option value="3">Оценка: 3 из 5 (Удовлетворительно)</option>
            </select>
            <textarea id="review-text" placeholder="Поделитесь вашим мнением о товаре..." rows="4" required></textarea>
            <button type="submit" class="btn btn--primary">Опубликовать отзыв</button>
          </form>
        </div>
      </section>

      <!-- Похожие товары -->
      ${relatedProducts.length > 0 ? `
        <section class="related-section">
          <h2 class="section-title">Вам также понравится</h2>
          <div class="products-grid">
            ${relatedProducts.map(rel => `
              <article class="product-card">
  <div class="product-card__image-container">
    <a href="product.html?id=${rel.id}">
      <img src="${fixImagePath(rel.image, rel.title)}" alt="${rel.title}" class="product-card__img">
    </a>
  </div>
  <div class="product-card__info">
    <span class="product-card__category">${rel.categoryName || ''}</span>
    <h3 class="product-card__title"><a href="product.html?id=${rel.id}">${rel.title}</a></h3>
    <div class="product-card__footer">
      <span class="product-card__price">${formatPrice(rel.price)}</span>
      <a href="product.html?id=${rel.id}" class="btn btn--secondary">Смотреть</a>
    </div>
  </div>
</article>
            `).join('')}
          </div>
        </section>
      ` : ''}
    `;

    // Обработчики событий
    const addToCartBtn = container.querySelector('.add-to-cart-btn');
    const cartBtn = document.getElementById('cart-btn');
    const cartBadge = document.getElementById('cart-count');

    const updateCartBadge = () => {
      let cart = JSON.parse(localStorage.getItem('lumina_cart')) || [];
      const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      if (cartBadge) cartBadge.textContent = totalCount;
    };

    updateCartBadge();

  if (addToCartBtn) {
      addToCartBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const mainImage = container.querySelector('.product-detail__main-img');

        let cart = JSON.parse(localStorage.getItem('lumina_cart')) || [];
        const index = cart.findIndex(item => item.id === product.id);
        if (index > -1) {
          cart[index].quantity += 1;
        } else {
          cart.push({ id: product.id, quantity: 1 });
        }
        localStorage.setItem('lumina_cart', JSON.stringify(cart));

        if (typeof updateCartUI === 'function') {
          updateCartUI();
        } else {
          updateCartBadge();
        }

        // Анимация полёта 
        if (mainImage && cartBtn) {
          const imgRect = mainImage.getBoundingClientRect();
          const cartRect = cartBtn.getBoundingClientRect();

          const imgClone = mainImage.cloneNode(true);
          imgClone.classList.add('fly-to-cart-clone');

          imgClone.style.left = `${imgRect.left}px`;
          imgClone.style.top = `${imgRect.top}px`;
          imgClone.style.width = `${imgRect.width}px`;
          imgClone.style.height = `${imgRect.height}px`;

          document.body.appendChild(imgClone);

          requestAnimationFrame(() => {
            const targetLeft = cartRect.left + cartRect.width / 2 - 25;
            const targetTop = cartRect.top + cartRect.height / 2 - 25;

            imgClone.style.left = `${targetLeft}px`;
            imgClone.style.top = `${targetTop}px`;
            imgClone.style.width = '50px';
            imgClone.style.height = '50px';
            imgClone.style.opacity = '0.3';
            imgClone.style.transform = 'scale(0.4)';
          });

          setTimeout(() => {
            imgClone.remove();

            cartBtn.classList.add('cart-bounce');
            setTimeout(() => {
              cartBtn.classList.remove('cart-bounce');
            }, 400);
          }, 800);
        }
      });
    }

    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({ title: product.title, url: window.location.href });
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert('Ссылка на товар скопирована!');
        }
      });
    }
    
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('review-author').value;
        const rating = Number(document.getElementById('review-rating').value);
        const text = document.getElementById('review-text').value;
        const date = new Date().toLocaleDateString('ru-RU');

        reviews.unshift({ name, rating, text, date });
        localStorage.setItem(`reviews_prod_${product.id}`, JSON.stringify(reviews));
        location.reload();
      });
    }
  };
});