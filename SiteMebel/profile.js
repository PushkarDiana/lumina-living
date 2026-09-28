document.addEventListener('DOMContentLoaded', async () => {
  let user = JSON.parse(localStorage.getItem('lumina_user'));

  if (!user || !user.id) {
    window.location.href = 'index.html';
    return;
  }

  // Базовый URL для API
  const getApiBaseUrl = () => {
    if (typeof API_URL !== 'undefined') {
      return API_URL.replace(/\/products\/?$/i, '');
    }
    return 'https://localhost:7197/api';
  };

  // Элементы профиля
  const nameEl = document.getElementById('profile-user-name');
  const emailEl = document.getElementById('profile-user-email');
  const settingsNameInput = document.getElementById('settings-name');
  const settingsPhoneInput = document.getElementById('settings-phone');
  const settingsEmailInput = document.getElementById('settings-email');

  try {
    const userResponse = await fetch(`${getApiBaseUrl()}/auth/user/${user.id}`);
    if (userResponse.ok) {
      const serverUser = await userResponse.json();
      user = serverUser;
      localStorage.setItem('lumina_user', JSON.stringify(user)); 
    }
  } catch (e) {
    console.log("Не удалось подтянуть свежие данные с сервера, используем локальные", e);
  }

  const populateUserData = () => {
    if (user) {
      if (nameEl) nameEl.textContent = user.fullName || user.FullName || 'Пользователь';
      if (emailEl) emailEl.textContent = user.email || user.Email || '';
      if (settingsNameInput) settingsNameInput.value = user.fullName || user.FullName || '';
      if (settingsEmailInput) settingsEmailInput.value = user.email || user.Email || '';

      const rawPhone = user.phone || user.phoneNumber || user.Phone || user.PhoneNumber || '';
      if (settingsPhoneInput && rawPhone) {
        settingsPhoneInput.value = rawPhone;
        settingsPhoneInput.dispatchEvent(new Event('input')); 
      }
    }
  };
  populateUserData();

  // Переключение вкладок
  const menuItems = document.querySelectorAll('.profile-menu__item[data-tab]');
  const tabs = document.querySelectorAll('.profile-tab');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.dataset.tab;
      menuItems.forEach(i => i.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));

      item.classList.add('active');
      const activeTabEl = document.getElementById(`tab-${targetTab}`);
      if (activeTabEl) activeTabEl.classList.add('active');
    });
  });

  // Выход из аккаунта
  const logoutBtn = document.getElementById('profile-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('lumina_user');
      window.location.href = 'index.html';
    });
  }

  // Сохранение настроек профиля (Имя, Телефон с валидацией)
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = settingsNameInput.value.trim();
      const phone = settingsPhoneInput.value.trim();

      const cleanPhone = phone.replace(/\D/g, '');
      if (phone !== '' && cleanPhone.length < 11) {
        alert('Пожалуйста, введите корректный номер телефона (11 цифр)');
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/update/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, phone })
        });

        const data = await response.json();

        if (response.ok) {
          user = data;
          localStorage.setItem('lumina_user', JSON.stringify(user));
          populateUserData();
          alert('Профиль успешно обновлен!');
        } else {
          alert(data.message || 'Ошибка обновления профиля');
        }
      } catch (err) {
        console.error(err);
        alert('Не удалось связаться с сервером');
      }
    });
  }

  // Изменение пароля
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('old-password').value;
      const newPassword = document.getElementById('new-password').value;

      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/change-password/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
          alert('Пароль успешно изменен!');
          passwordForm.reset();
        } else {
          alert(data.message || 'Ошибка смены пароля');
        }
      } catch (err) {
        console.error(err);
        alert('Не удалось связаться с сервером');
      }
    });
  }

  // Маска для телефона
  const phoneInput = document.getElementById('settings-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      if (value.length > 11) {
        value = value.slice(0, 11);
      }

      let formattedValue = '';

      if (value.length > 0) {
        if (value[0] === '9') {
          value = '7' + value;
        }
        
        const firstChar = value[0] === '8' ? '8' : '+7';
        formattedValue = firstChar + ' ';

        if (value.length > 1) {
          formattedValue += '(' + value.substring(1, 4);
        }
        if (value.length >= 5) {
          formattedValue += ') ' + value.substring(4, 7);
        }
        if (value.length >= 8) {
          formattedValue += '-' + value.substring(7, 9);
        }
        if (value.length >= 10) {
          formattedValue += '-' + value.substring(9, 11);
        }
      }

      e.target.value = formattedValue;
    });

    phoneInput.addEventListener('keydown', (e) => {
      const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
      if (allowedKeys.includes(e.key)) return;

      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    });
  }

  // ЗАГРУЗКА ИСТОРИИ ЗАКАЗОВ В ПРОФИЛЕ
  const loadUserOrders = async () => {
    const container = document.getElementById('orders-container');
    if (!container) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить историю заказов');
      }

      const orders = await response.json();

      if (!orders || orders.length === 0) {
        container.innerHTML = `
          <div class="profile-empty-state">
            <i class="fa-solid fa-receipt"></i>
            <p>У вас пока нет оформленных заказов</p>
            <a href="index.html#catalog" class="btn btn--primary" style="margin-top: 16px;">Перейти в каталог</a>
          </div>
        `;
        return;
      }

      container.innerHTML = orders.map(order => {
        const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : 'Не указана';
        const deliveryFormatted = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('ru-RU') : 'Не указана';

        const itemsListHtml = order.orderItems && order.orderItems.length > 0
          ? order.orderItems.map(item => {
              const productName = item.product?.name || item.product?.title || item.name || item.title || 'Товар без названия';
              const productPrice = item.product?.price || item.price || 0;
              const productQty = item.quantity || item.count || 1;

              return `
                <div class="order-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f7f7f7;">
                  <span style="font-weight: 500; color: #222;">${productName}</span>
                  <span style="font-size: 13px; color: #666;">${productQty} шт. × ${productPrice} ₽</span>
                </div>
              `;
            }).join('')
          : '<p style="color: #666; font-size: 14px;">Нет данных о товарах</p>';

        const totalSum = order.totalAmount || 0;
        return `
          <div class="order-card" style="border: 1px solid #eaeaea; padding: 20px; border-radius: 12px; margin-bottom: 20px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; margin-bottom: 15px;">
              <strong style="font-size: 1.1rem; color: #111;">Заказ #${order.id}</strong>
              <span style="color: #666; font-size: 0.9rem;">Создан: ${dateFormatted}</span>
            </div>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Адрес доставки:</strong> ${order.shippingAddress || 'Не указан'}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Дата доставки:</strong> ${deliveryFormatted}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Статус:</strong> <span style="color: #007bff; font-weight: 500;">${order.status || 'Новый'}</span></p>
            
            <div style="margin-top: 15px;">
              <strong style="display: block; margin-bottom: 10px; font-size: 14px; color: #333;">Состав заказа:</strong>
              ${itemsListHtml}
            </div>

            <div style="margin-top: 15px; text-align: right; font-size: 1.1rem; font-weight: bold; color: #111; border-top: 1px dashed #eee; padding-top: 10px;">
              Итого: ${order.totalAmount} ₽
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error(error);
      container.innerHTML = '<p style="color: #d9534f; padding: 15px;">Ошибка при загрузке истории заказов с сервера.</p>';
    }
  };

  loadUserOrders();
});