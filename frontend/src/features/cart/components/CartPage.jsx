import React, { useEffect, useState } from 'react';
import { getUserCart, updateCartItemQuantity, deleteCartItem } from '../api';
import { checkoutOrder } from '../../orders/api'; // Подключили API оформления заказа
import './CartPage.css';

export const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  // Стейты для модального окна оформления заказа
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ phone: '', address: '', comment: '' });

  // Функция загрузки данных корзины из базы данных
  const loadCart = async () => {
    try {
      const data = await getUserCart();
      setCart(data);
    } catch (err) {
      console.error("Ошибка при загрузке корзины:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadCart();
  }, []);

  // Изменение количества товара (+1 / -1)
  const handleQuantityChange = async (item, change) => {
    const newQuantity = item.quantity + change;

    // Если количество падает до 0 — запускаем сценарий удаления
    if (newQuantity <= 0) {
      handleRemoveItem(item);
      return;
    }

    try {
      await updateCartItemQuantity(item.id, newQuantity);
      await loadCart(); // Перезапрашиваем точные данные и суммы из СУБД
    } catch (err) {
      alert("Не удалось изменить количество:\n" + (err.response?.data?.detail || err.message));
    }
  };

  // Полное удаление товара с подтверждением
  const handleRemoveItem = async (item) => {
    if (!window.confirm(`Вы действительно хотите удалить "${item.product?.name}" из корзины?`)) return;

    try {
      await deleteCartItem(item.id);
      await loadCart(); // Перезапрашиваем корзину из СУБД
    } catch (err) {
      alert("Не удалось удалить товар: " + (err.response?.data?.detail || err.message));
    }
  };

  // Обработчик отправки формы заказа на бэкенд
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!checkoutForm.phone || !checkoutForm.address) {
      alert("Пожалуйста, заполните телефон и адрес доставки!");
      return;
    }
    try {
      const response = await checkoutOrder({
        phone: checkoutForm.phone,
        delivery_address: checkoutForm.address,
        comment: checkoutForm.comment
      });
      alert(`🎉 Заказ №${response.order_id} успешно оформлен! Проверить его статус можно в Личном кабинете.`);
      setIsCheckoutModalOpen(false);
      window.location.href = '/profile'; // Перенаправляем покупателя в профиль смотреть историю
    } catch (err) {
      alert("Ошибка оформления: " + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontWeight: '600' }}>Загрузка корзины...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="cart-empty-state">
        <h2>Ваша корзина пуста 😔</h2>
        <p>Перейдите на главную страницу, чтобы выбрать классные товары!</p>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      <h2 className="cart-page-title">🛒 Ваша корзина</h2>

      <div className="cart-items-list">
        {cart.items.map((item) => {
          const hasImage = item.product?.images && item.product.images.length > 0;
          const imageUrl = hasImage
            ? `http://localhost:8000${item.product.images[0].url}`
            : 'https://placeholder.com';

          // Логика определения лимитов склада для каждой строки
          const currentVariant = item.product?.variants?.find(v => v.id === item.variant_id);
          const maxStock = currentVariant ? parseInt(currentVariant.stock, 10) : 0;

          const displayQuantity = item.quantity > maxStock ? maxStock : item.quantity;
          const isMaxStockReached = item.quantity >= maxStock;

          return (
            <div key={item.id} className="cart-item-row">

              {/* Миниатюра товара */}
              <img src={imageUrl} alt={item.product?.name} className="cart-item-image" />

              {/* Информация о товаре */}
              <div className="cart-item-info">
                <h4 className="cart-item-name">{item.product?.name}</h4>
                <p className="cart-item-price">
                  {Number(item.product?.base_price).toLocaleString()} ₽ <span className="cart-item-price-sub">/ шт.</span>
                </p>
                <small className="cart-item-stock-hint">
                  В наличии: <strong>{maxStock}</strong> шт.
                </small>
              </div>

              {/* Блок управления количеством и удалением */}
              <div className="cart-item-controls">

                {/* Группа кнопок плюс-минус */}
                <div className="quantity-toggle-group">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item, -1)}
                    className="btn-quantity"
                  >
                    -
                  </button>

                  <span
                    className="quantity-display-value"
                    style={{ color: isMaxStockReached ? '#e74a3b' : '#000000' }}
                  >
                    {displayQuantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item, 1)}
                    disabled={isMaxStockReached}
                    className="btn-quantity"
                    style={{ cursor: isMaxStockReached ? 'not-allowed' : 'pointer' }}
                    title={isMaxStockReached ? `Достигнут лимит склада (В наличии: ${maxStock} шт.)` : ""}
                  >
                    +
                  </button>
                </div>

                {/* Кнопка удаления */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item)}
                  className="btn-cart-remove"
                >
                  🗑️ Удалить
                </button>

              </div>
            </div>
          );
        })}
      </div>

      {/* Итоговая строка */}
      <div className="cart-summary-row">
        <span className="cart-summary-label">Итого к оплате:</span>
        <span className="cart-summary-value">
          {Number(cart.total_price).toLocaleString()} ₽
        </span>
      </div>

      {/* Кнопка оформления, открывающая модальное окно */}
      <button
        type="button"
        className="btn-checkout-submit"
        onClick={() => setIsCheckoutModalOpen(true)}
      >
        Перейти к оформлению заказа
      </button>

      {/* МОДАЛЬНОЕ ОКНО ОФОРМЛЕНИЯ ЗАКАЗА */}
      {isCheckoutModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', position: 'relative' }}>
            <button onClick={() => setIsCheckoutModalOpen(false)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            <h3 style={{ color: '#111827', marginBottom: '20px' }}>📦 Данные доставки</h3>

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>Номер телефона:</label>
              <input type="text" required value={checkoutForm.phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} placeholder="+7 (999) 000-00-00" style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '6px', color: '#000' }} />

              <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>Адрес доставки (Город, улица, дом, кв):</label>
              <input type="text" required value={checkoutForm.address} onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })} placeholder="г. Томск, ул. Ленина, д. 1" style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '6px', color: '#000' }} />

              <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>Комментарий к заказу (необязательно):</label>
              <textarea value={checkoutForm.comment} onChange={(e) => setCheckoutForm({ ...checkoutForm, comment: e.target.value })} placeholder="Например: Позвонить за час до доставки" rows="2" style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '6px', resize: 'none', color: '#000' }} />

              <button type="submit" style={{ padding: '12px', backgroundColor: '#1cc88a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
                🚀 Подтвердить заказ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
