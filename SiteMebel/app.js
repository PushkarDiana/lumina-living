document.addEventListener('DOMContentLoaded', () => {
  let cart = JSON.parse(localStorage.getItem('lumina_cart')) || [];
  let wishlist = JSON.parse(localStorage.getItem('lumina_wishlist')) || [];
  let currentCategory = 'all';

  const productsGrid = document.getElementById('products-grid');
  const newProductsContainer = document.getElementById('new-products-container');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cartBtn = document.getElementById('cart-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartTotalPrice = document.getElementById('cart-total-price');
  const cartCountBadge = document.getElementById('cart-count');
  const wishlistBadge = document.querySelector('.badge--wishlist');
  const modalOverlay = document.getElementById('quick-view-overlay');
  const modal = document.getElementById('quick-view-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalContent = document.getElementById('modal-content');

  const wishlistBtn = document.getElementById('wishlist-btn');
  const wishlistDrawer = document.getElementById('wishlist-drawer');
  const wishlistOverlay = document.getElementById('wishlist-overlay');
  const wishlistCloseBtn = document.getElementById('wishlist-close-btn');
  const wishlistItemsContainer = document.getElementById('wishlist-items-container');

  const formatPrice = (price) => {
    return price ? price.toLocaleString('ru-RU') + ' ₽' : '0 ₽';
  };

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

  let newArrivalsSwiper = null;

  const toggleCartDrawer = (open) => {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.toggle('open', open);
      cartOverlay.classList.toggle('open', open);

      if (!open && newArrivalsSwiper && newArrivalsSwiper.autoplay) {
        newArrivalsSwiper.autoplay.start();
      }
    }
  };

  const toggleWishlistDrawer = (open) => {
    if (wishlistDrawer && wishlistOverlay) {
      wishlistDrawer.classList.toggle('open', open);
      wishlistOverlay.classList.toggle('open', open);
    }
  };

  if (wishlistBtn) wishlistBtn.addEventListener('click', () => toggleWishlistDrawer(true));
  if (wishlistCloseBtn) wishlistCloseBtn.addEventListener('click', () => toggleWishlistDrawer(false));
  if (wishlistOverlay) wishlistOverlay.addEventListener('click', () => toggleWishlistDrawer(false));

  const renderNewArrivals = () => {
    if (!newProductsContainer || typeof products === 'undefined' || !products.length) return;

    let newProducts = products.filter(p => p.isNew);
    if (newProducts.length === 0) {
      newProducts = products.slice(0, 8);
    }

    newProductsContainer.innerHTML = newProducts.map(product => {
      const isLiked = wishlist.includes(product.id);
      return `
        <div class="swiper-slide">
          <article class="product-card" data-id="${product.id}">
            <div class="product-card__image-container">
              <span class="badge-new">NEW</span>
              <button class="wishlist-btn ${isLiked ? 'active' : ''}" data-id="${product.id}" aria-label="В избранное">
                <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
              <img src="${fixImagePath(product.image, product.title)}" alt="${product.title}" class="product-card__img" loading="lazy">
              <button class="quick-view-btn">Быстрый просмотр</button>
            </div>
            <div class="product-card__info">
              <span class="product-card__category">${product.categoryName || ''}</span>
              <h3 class="product-card__title">
                <a href="product.html?id=${product.id}">${product.title}</a>
              </h3>
              <div class="product-card__footer">
                <div class="product-card__prices">
                  <span class="product-card__price">${formatPrice(product.price)}</span>
                  ${product.oldPrice ? `<span class="product-card__price-old">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <button class="btn btn--secondary add-to-cart-btn" data-id="${product.id}">В корзину</button>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join('');

    if (newArrivalsSwiper) {
      newArrivalsSwiper.destroy(true, true);
    }

    newArrivalsSwiper = new Swiper('.new-products-slider', {
      slidesPerView: 1,
      spaceBetween: 16,
      loop: true,
      grabCursor: true,
      preventClicks: false,
      preventClicksPropagation: false,
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      navigation: {
        nextEl: '.btn-new-next',
        prevEl: '.btn-new-prev',
      },
      breakpoints: {
        576: { slidesPerView: 2, spaceBetween: 20 },
        992: { slidesPerView: 3, spaceBetween: 28 },
        1400: { slidesPerView: 3, spaceBetween: 32 },
      },
    });
  };

  const matchCategory = (product, categoryKey) => {
    if (categoryKey === 'all') return true;

    const prodCategory = String(product.category || '').toLowerCase();
    const catName = String(product.categoryName || '').toLowerCase();
    const title = String(product.title || '').toLowerCase();

    if (categoryKey === 'sofas') {
      return prodCategory.includes('sofa') || catName.includes('диван') || catName.includes('кресло') || catName.includes('мебель') || title.includes('диван') || title.includes('кресло');
    }
    if (categoryKey === 'lighting') {
      return prodCategory.includes('light') || catName.includes('освещ') || catName.includes('ламп') || catName.includes('светильник') || catName.includes('торшер') || title.includes('торшер') || title.includes('лампа') || title.includes('светильник');
    }
    if (categoryKey === 'tables') {
      return prodCategory.includes('table') || catName.includes('стол') || catName.includes('столик') || title.includes('стол');
    }
    if (categoryKey === 'decor') {
      return prodCategory.includes('decor') || catName.includes('декор') || catName.includes('ваз') || catName.includes('свеч') || title.includes('ваза');
    }

    return prodCategory === categoryKey || catName === categoryKey;
  };
  if (filterBtns && filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentCategory = e.currentTarget.dataset.category;
        renderProducts();
      });
    });
  }

  // 1. РЕНДЕР КАРТОЧЕК ТОВАРОВ (Каталог)
  const renderProducts = () => {
    if (!productsGrid || typeof products === 'undefined' || !products.length) return;
    
    const filteredProducts = products.filter(p => matchCategory(p, currentCategory));

    productsGrid.innerHTML = filteredProducts.map(product => {
      const isLiked = wishlist.includes(product.id);
      return `
        <article class="product-card" data-id="${product.id}">
          <div class="product-card__image-container">
            ${product.badge ? `<span class="tag">${product.badge}</span>` : ''}
            <button class="wishlist-btn ${isLiked ? 'active' : ''}" data-id="${product.id}" aria-label="В избранное">
              <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <img src="${fixImagePath(product.image, product.title)}" alt="${product.title}" class="product-card__img" loading="lazy">
            <button class="quick-view-btn">Быстрый просмотр</button>
          </div>
          <div class="product-card__info">
            <span class="product-card__category">${product.categoryName || ''}</span>
            <h3 class="product-card__title">
              <a href="product.html?id=${product.id}">${product.title}</a>
            </h3>            
            <div class="product-card__footer">
              <div class="product-card__prices">
                <span class="product-card__price">${formatPrice(product.price)}</span>
                ${product.oldPrice ? `<span class="product-card__price-old">${formatPrice(product.oldPrice)}</span>` : ''}
              </div>
              <button class="btn btn--secondary add-to-cart-btn" data-id="${product.id}">В корзину</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  };

  // 2. ФИЛЬТРАЦИЯ
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      renderProducts();
    });
  });

  // 3. УПРАВЛЕНИЕ КОРЗИНОЙ
  const updateCartUI = () => {
    localStorage.setItem('lumina_cart', JSON.stringify(cart));

    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCountBadge) cartCountBadge.textContent = totalCount;

    const totalSum = cart.reduce((acc, item) => {
      const prod = typeof products !== 'undefined' ? products.find(p => p.id === item.id) : null;
      return acc + (prod ? prod.price * item.quantity : 0);
    }, 0);
    if (cartTotalPrice) cartTotalPrice.textContent = formatPrice(totalSum);

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="cart-empty-msg">Ваша корзина пуста</p>';
      return;
    }

    cartItemsContainer.innerHTML = cart.map(item => {
      const prod = typeof products !== 'undefined' ? products.find(p => p.id === item.id) : null;
      if (!prod) return '';

      const itemTotalPrice = prod.price * item.quantity;

      return `
        <div class="cart-item">
          <img src="${fixImagePath(prod.image, prod.title)}" alt="${prod.title}" class="cart-item__img">
          <div class="cart-item__details">
            <h4 class="cart-item__title">${prod.title}</h4>
            <div class="cart-item__price">
              <strong>${formatPrice(itemTotalPrice)}</strong>
              ${item.quantity > 1 ? `<span style="font-size: 12px; color: var(--text-muted); font-weight: normal; margin-left: 6px;">(${formatPrice(prod.price)} / шт.)</span>` : ''}
            </div>
            <div class="cart-item__controls">
              <button class="cart-item__qty-btn qty-minus" data-id="${item.id}">-</button>
              <span>${item.quantity}</span>
              <button class="cart-item__qty-btn qty-plus" data-id="${item.id}">+</button>
            </div>
          </div>
          <button class="cart-item__remove" data-id="${item.id}"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `;
    }).join('');
  };

  const addToCart = (id) => {
    const existingIndex = cart.findIndex(item => item.id === id);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ id: id, quantity: 1 });
    }
    
    updateCartUI();
  };

  // 4. УПРАВЛЕНИЕ ИЗБРАННЫМ
  const updateWishlistUI = () => {
    localStorage.setItem('lumina_wishlist', JSON.stringify(wishlist));

    if (wishlistBadge) wishlistBadge.textContent = wishlist.length;

    if (!wishlistItemsContainer) return;

    if (wishlist.length === 0) {
      wishlistItemsContainer.innerHTML = '<p class="cart-empty-msg">В избранном пока ничего нет</p>';
      return;
    }

    wishlistItemsContainer.innerHTML = wishlist.map(id => {
      const prod = typeof products !== 'undefined' ? products.find(p => p.id === id) : null;
      if (!prod) return '';
      return `
        <div class="cart-item">
          <img src="${fixImagePath(prod.image, prod.title)}" alt="${prod.title}" class="cart-item__img">
          <div class="cart-item__details">
            <h4 class="cart-item__title">${prod.title}</h4>
            <div class="cart-item__price">${formatPrice(prod.price)}</div>
            <button class="btn btn--secondary add-to-cart-from-wishlist" data-id="${prod.id}" style="padding: 6px 12px; font-size: 12px; margin-top: 6px;">В корзину</button>
          </div>
          <button class="cart-item__remove remove-wishlist-item" data-id="${prod.id}"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `;
    }).join('');
  };

  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
      wishlist = wishlist.filter(itemId => itemId !== id);
    } else {
      wishlist.push(id);
    }
    
    updateWishlistUI();

    const isLiked = wishlist.includes(id);

    const allWishBtns = document.querySelectorAll(`.wishlist-btn[data-id="${id}"]`);
    allWishBtns.forEach(btn => {
      btn.classList.toggle('active', isLiked);
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
      }
    });
  };

if (wishlistItemsContainer) {
    wishlistItemsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-wishlist-item');
      const addCartBtn = e.target.closest('.add-to-cart-from-wishlist');

      if (removeBtn) {
        const id = Number(removeBtn.dataset.id);
        toggleWishlist(id);
      } else if (addCartBtn) {
        const id = Number(addCartBtn.dataset.id);
        addToCart(id);

        const originalText = addCartBtn.textContent;
        addCartBtn.textContent = 'Добавлено ✓';
        addCartBtn.style.backgroundColor = '#2e7d32';
        addCartBtn.style.borderColor = '#2e7d32';
        addCartBtn.style.color = '#ffffff';

        if (cartBtn) {
          cartBtn.classList.add('cart-bounce');
          setTimeout(() => cartBtn.classList.remove('cart-bounce'), 400);
        }

        setTimeout(() => {
          addCartBtn.textContent = originalText;
          addCartBtn.style.backgroundColor = '';
          addCartBtn.style.borderColor = '';
          addCartBtn.style.color = '';
        }, 1500);
      }
    });
  }

  window.initCatalogUI = () => {
    renderProducts();
    renderNewArrivals();
    updateCartUI();
    updateWishlistUI();
  };

  if (cartBtn) cartBtn.addEventListener('click', () => toggleCartDrawer(true));
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', () => toggleCartDrawer(false));
  if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCartDrawer(false));

  const handleCardClick = (e) => {
    const addBtn = e.target.closest('.add-to-cart-btn');
    const wishBtn = e.target.closest('.wishlist-btn');
    const quickViewBtn = e.target.closest('.quick-view-btn');

    if (addBtn) {
      const id = Number(addBtn.dataset.id);
      addToCart(id);

      const originalText = addBtn.textContent;
      addBtn.textContent = 'Добавлено ✓';
      addBtn.classList.add('added');

      setTimeout(() => {
        addBtn.textContent = originalText;
        addBtn.classList.remove('added');
      }, 1500);

      const card = addBtn.closest('.product-card');
      const cardImage = card ? card.querySelector('.product-card__img') : null;

      if (cardImage && cartBtn) {
        const imgRect = cardImage.getBoundingClientRect();
        const cartRect = cartBtn.getBoundingClientRect();

        const imgClone = cardImage.cloneNode(true);
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
    } else if (wishBtn) {
      toggleWishlist(Number(wishBtn.dataset.id));
    } else if (quickViewBtn) {
      const card = e.target.closest('.product-card');
      if (card) openQuickView(Number(card.dataset.id));
    }
  };

  if (productsGrid) productsGrid.addEventListener('click', handleCardClick);
  if (newProductsContainer) newProductsContainer.addEventListener('click', handleCardClick);

  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-to-cart-btn');
      if (addBtn) {
        addToCart(Number(addBtn.dataset.id));
        closeQuickView();
      }
    });
  }

  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (e) => {
      const plusBtn = e.target.closest('.qty-plus');
      const minusBtn = e.target.closest('.qty-minus');
      const removeBtn = e.target.closest('.cart-item__remove');

      if (plusBtn) {
        const id = Number(plusBtn.dataset.id);
        const item = cart.find(i => i.id === id);
        if (item) item.quantity += 1;
      } else if (minusBtn) {
        const id = Number(minusBtn.dataset.id);
        const item = cart.find(i => i.id === id);
        if (item && item.quantity > 1) {
          item.quantity -= 1;
        } else {
          cart = cart.filter(i => i.id !== id);
        }
      } else if (removeBtn) {
        const id = Number(removeBtn.dataset.id);
        cart = cart.filter(i => i.id !== id);
      }
      updateCartUI();
    });
  }

  const openQuickView = (productId) => {
    if (typeof products === 'undefined') return;
    const product = products.find(p => p.id === productId);
    if (!product || !modalContent) return;

    modalContent.innerHTML = `
      <div class="modal__grid">
        <img src="${fixImagePath(product.image, product.title)}" alt="${product.title}" class="modal__image">
        <div class="modal__info">
          <span class="modal__category">${product.categoryName || ''}</span>
          <h2 class="modal__title">${product.title}</h2>
          <div class="modal__price-box">
            <span class="modal__price">${formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="modal__price-old">${formatPrice(product.oldPrice)}</span>` : ''}
          </div>
          <p class="modal__description">
            ${product.description || 'Элегантный элемент интерьера из премиальных материалов.'}
          </p>
          <button class="btn btn--primary add-to-cart-btn" data-id="${product.id}" style="width: 100%;">
            Добавить в корзину
          </button>
        </div>
      </div>
    `;

    if (modal && modalOverlay) {
      modal.classList.add('open');
      modalOverlay.classList.add('open');
    }
  };

  const closeQuickView = () => {
    if (modal && modalOverlay) {
      modal.classList.remove('open');
      modalOverlay.classList.remove('open');
    }
  };

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeQuickView);
  if (modalOverlay) modalOverlay.addEventListener('click', closeQuickView);

  // Форма обратной связи
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('.form-submit-btn');
      const originalText = submitBtn.textContent;

      submitBtn.textContent = 'Заявка отправлена ✓';
      submitBtn.style.backgroundColor = '#2e7d32';
      contactForm.reset();

      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.backgroundColor = '';
      }, 3000);
    });
  }

  const navLinks = document.querySelectorAll('.nav__link');

  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // --- ЛОГИКА ПОИСКА ---
  const searchBtn = document.getElementById('search-btn');
  const searchModal = document.getElementById('search-modal');
  const searchOverlay = document.getElementById('search-overlay');
  const searchCloseBtn = document.getElementById('search-close-btn');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  const toggleSearchModal = (open) => {
    if (searchModal && searchOverlay) {
      searchModal.classList.toggle('open', open);
      searchOverlay.classList.toggle('open', open);
      if (open && searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    }
  };

  if (searchBtn) searchBtn.addEventListener('click', () => toggleSearchModal(true));
  if (searchCloseBtn) searchCloseBtn.addEventListener('click', () => toggleSearchModal(false));
  if (searchOverlay) searchOverlay.addEventListener('click', () => toggleSearchModal(false));

  // Обработка ввода текста в поле поиска
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();

      if (!query) {
        searchResults.innerHTML = '<p class="search-placeholder">Введите название или категорию товара для поиска</p>';
        return;
      }

      if (typeof products === 'undefined' || !products.length) return;

      const foundProducts = products.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(query);
        const categoryMatch = (p.categoryName || '').toLowerCase().includes(query);
        return titleMatch || categoryMatch;
      });

      if (foundProducts.length === 0) {
        searchResults.innerHTML = '<p class="search-no-results">Ничего не найдено</p>';
        return;
      }

      searchResults.innerHTML = foundProducts.map(p => `
        <a href="product.html?id=${p.id}" class="search-result-item">
          <img src="${fixImagePath(p.image, p.title)}" alt="${p.title}" class="search-result-item__img">
          <div class="search-result-item__info">
            <div class="search-result-item__title">${p.title}</div>
            <div class="search-result-item__price">${formatPrice(p.price)}</div>
          </div>
          <i class="fa-solid fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
        </a>
      `).join('');
    });
  }

  // --- ЛОГИКА АВТОРИЗАЦИИ И ПРОФИЛЯ ---
  const authBtn = document.getElementById('auth-btn');
  const authModal = document.getElementById('auth-modal');
  const authOverlay = document.getElementById('auth-overlay');
  const authCloseBtn = document.getElementById('auth-close-btn');

  const loginContainer = document.getElementById('login-form-container');
  const registerContainer = document.getElementById('register-form-container');
  const profileContainer = document.getElementById('profile-container');

  const showRegisterBtn = document.getElementById('show-register-btn');
  const showLoginBtn = document.getElementById('show-login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  let currentUser = JSON.parse(localStorage.getItem('lumina_user')) || null;

  const updateAuthUI = () => {
    const authIcon = document.getElementById('auth-icon');
    if (currentUser) {
      if (authIcon) authIcon.className = 'fa-solid fa-user'; // Закрашенная иконка при входе
      if (loginContainer) loginContainer.style.display = 'none';
      if (registerContainer) registerContainer.style.display = 'none';
      if (profileContainer) {
        profileContainer.style.display = 'block';
        document.getElementById('user-display-name').textContent = currentUser.fullName || 'Пользователь';
        document.getElementById('user-display-email').textContent = currentUser.email;
      }
    } else {
      if (authIcon) authIcon.className = 'fa-regular fa-user';
      if (profileContainer) profileContainer.style.display = 'none';
      if (registerContainer) registerContainer.style.display = 'none';
      if (loginContainer) loginContainer.style.display = 'block';
    }
  };

  const toggleAuthModal = (open) => {
    if (authModal && authOverlay) {
      updateAuthUI();
      authModal.classList.toggle('open', open);
      authOverlay.classList.toggle('open', open);
    }
  };

if (authBtn) {
    authBtn.addEventListener('click', (e) => {
      if (currentUser) {
        window.location.href = 'profile.html';
      } else {
        toggleAuthModal(true);
      }
    });
  }  if (authCloseBtn) authCloseBtn.addEventListener('click', () => toggleAuthModal(false));
  if (authOverlay) authOverlay.addEventListener('click', () => toggleAuthModal(false));

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginContainer.style.display = 'none';
      registerContainer.style.display = 'block';
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      registerContainer.style.display = 'none';
      loginContainer.style.display = 'block';
    });
  }
  const getApiBaseUrl = () => {
    if (typeof API_URL !== 'undefined') {
      return API_URL.replace(/\/products\/?$/, '');
    }
    return 'https://localhost:7197/api';
  };
  // Запрос на Вход
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          currentUser = data;
          localStorage.setItem('lumina_user', JSON.stringify(currentUser));
          updateAuthUI();
          alert(`С возвращением, ${currentUser.fullName || currentUser.email}!`);
          toggleAuthModal(false);
        } else {
          alert(data.message || 'Ошибка входа');
        }
      } catch (err) {
        console.error('Ошибка входа:', err);
        alert('Ошибка соединения с сервером. Проверьте консоль браузера (F12).');
      }
    });
  }

  // Запрос на Регистрацию
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;

      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ fullName, email, password })
        });

        const data = await response.json();

        if (response.ok) {
          currentUser = data;
          localStorage.setItem('lumina_user', JSON.stringify(currentUser));
          updateAuthUI();
          alert('Регистрация успешно завершена!');
          toggleAuthModal(false);
        } else {
          alert(data.message || 'Ошибка регистрации');
        }
      } catch (err) {
        console.error('Ошибка регистрации:', err);
        alert('Ошибка соединения с сервером. Проверьте консоль браузера (F12).');
      }
    });
  }

  // Выход из аккаунта
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      currentUser = null;
      localStorage.removeItem('lumina_user');
      updateAuthUI();
      toggleAuthModal(false);
    });
  }

  updateAuthUI();



// Обработка кнопки «Оформить заказ»
const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
const checkoutModalClose = document.getElementById('checkout-modal-close');
const checkoutConfirmForm = document.getElementById('checkout-confirm-form');

window.currentOrderTotal = 0;

// Функция открытия/закрытия окна подтверждения
const toggleCheckoutModal = (open) => {
    if (checkoutModalOverlay) {
        checkoutModalOverlay.classList.toggle('open', open);
        
        if (open) {
            const deliveryDateInput = document.getElementById('delivery-date');
            if (deliveryDateInput) {
                deliveryDateInput.min = new Date().toISOString().split('T')[0];
            }
        }
    }
};

if (checkoutModalClose) {
    checkoutModalClose.addEventListener('click', () => toggleCheckoutModal(false));
}

if (checkoutModalOverlay) {
    checkoutModalOverlay.addEventListener('click', (e) => {
        if (e.target === checkoutModalOverlay) toggleCheckoutModal(false);
    });
}

// Шаг 1: Нажатие на кнопку «Оформить заказ» в корзине
document.addEventListener('click', (event) => {
    const checkoutBtn = event.target.closest('#checkout-btn');
    if (!checkoutBtn) return;

    console.log('Кнопка "Оформление заказа" нажата');

    if (!currentUser) {
        alert('Пожалуйста, войдите в профиль или зарегистрируйтесь, чтобы оформить заказ.');
        
        const cartDrawer = document.getElementById('cart-drawer');
        const cartOverlay = document.getElementById('cart-overlay');
        if (cartDrawer) cartDrawer.classList.remove('active', 'open');
        if (cartOverlay) cartOverlay.classList.remove('active', 'open');

        toggleAuthModal(true);
        return; 
    }

    const savedCart = localStorage.getItem('lumina_cart');
    const cartItems = savedCart ? JSON.parse(savedCart) : (window.cart || []);    
    if (cartItems.length === 0) {
        alert('Ваша корзина пуста!');
        return;
    }

    let totalItemsCount = 0;
    let formattedItems = [];
    window.currentOrderTotal = 0;

    cartItems.forEach(item => {
        const prod = typeof products !== 'undefined' ? products.find(p => p.id === item.id) : null;
        const price = prod ? prod.price : (item.price || 1000);
        const quantity = Number(item.quantity || 1);
        
        totalItemsCount += quantity;
        window.currentOrderTotal += price * quantity;

        formattedItems.push({
            productId: item.id,
            quantity: quantity,
            price: price,
            ProductId: item.id,
            Quantity: quantity,
            Price: price
        });
    });

    const itemsCountElem = document.getElementById('confirm-items-count');
    const totalPriceElem = document.getElementById('confirm-total-price');
    
    if (itemsCountElem) itemsCountElem.textContent = totalItemsCount;
    if (totalPriceElem) totalPriceElem.textContent = window.currentOrderTotal.toLocaleString('ru-RU');

    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartDrawer) cartDrawer.classList.remove('active', 'open');
    if (cartOverlay) cartOverlay.classList.remove('active', 'open');

    toggleCheckoutModal(true);
});

// Шаг 2: Пользователь заполнил адрес, дату и подтвердил отправку в модальном окне
if (checkoutConfirmForm) {
    checkoutConfirmForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const address = document.getElementById('delivery-address').value;
        const deliveryDate = document.getElementById('delivery-date').value;
        const finalSubmitBtn = document.getElementById('final-submit-btn');

        const savedCart = localStorage.getItem('lumina_cart');
        const cartItems = savedCart ? JSON.parse(savedCart) : (window.cart || []); 

        const formattedItems = cartItems.map(item => {
            const prod = typeof products !== 'undefined' ? products.find(p => p.id === item.id) : null;
            const price = prod ? prod.price : (item.price || 1000);
            const quantity = Number(item.quantity || 1);

            return {
                productId: item.id,
                quantity: quantity,
                price: price,
                ProductId: item.id,
                Quantity: quantity,
                Price: price
            };
        });

        const total = window.currentOrderTotal > 0 ? window.currentOrderTotal : formattedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        const orderPayload = {
            items: formattedItems,
            Items: formattedItems,
            totalAmount: total,
            TotalAmount: total,
            shippingAddress: address,
            ShippingAddress: address,
            deliveryDate: deliveryDate,
            DeliveryDate: deliveryDate,
            createdAt: new Date().toISOString(),
            CreatedAt: new Date().toISOString()
        };

        console.log("Отправляем заказ на сумму:", total, orderPayload);

        try {
            finalSubmitBtn.disabled = true;
            finalSubmitBtn.textContent = 'Отправка заказа...';

            const response = await fetch('https://localhost:7197/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });

            if (response.ok) {
                await response.json().catch(() => ({}));
                alert('Заказ успешно оформлен! Сумма: ' + total.toLocaleString('ru-RU') + ' ₽');
                
                localStorage.removeItem('lumina_cart');
                window.cart = [];
                window.currentOrderTotal = 0;
                
                if (typeof updateCartUI === 'function') {
                    updateCartUI();
                }

                toggleCheckoutModal(false);
                checkoutConfirmForm.reset();
            } else {
                const errorText = await response.text();
                console.error('Ошибка от сервера:', errorText);
                throw new Error('Ошибка сервера: ' + response.status);
            }
        } catch (error) {
            console.error('Детали ошибки запроса:', error);
            alert('Ошибка: ' + error.message);
        } finally {
            finalSubmitBtn.disabled = false;
            finalSubmitBtn.textContent = 'Подтвердить заказ';
        }
    });
}
});
