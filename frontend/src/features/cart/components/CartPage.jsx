import React, { useEffect, useState } from 'react';
import { getUserCart, updateCartItemQuantity, deleteCartItem, checkCouponCode } from '../api';
import { checkoutOrder } from '../../orders/api'; // Подключили API оформления заказа
import './CartPage.css';

export const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  // Стейты для модального окна оформления заказа
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ phone: '', address: '', comment: '' });

  // === СТЕЙТЫ И ОБРАБОТЧИК ДЛЯ ПРОМОКОДОВ ===
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsChecking(true);
    setCouponError('');
    try {
      const data = await checkCouponCode(couponCode.trim());
      setAppliedCoupon(data); 
    } catch (err) {
      setCouponError(err.response?.data?.detail || 'Неверный промокод ❌');
      setAppliedCoupon(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

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
      
      // Сообщаем шапке, что количество изменилось
      window.dispatchEvent(new Event('cartUpdated'));

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

      // Сообщаем шапке, что товар полностью удален
      window.dispatchEvent(new Event('cartUpdated'));

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
        comment: checkoutForm.comment,
        coupon_code: appliedCoupon ? appliedCoupon.code : null
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

    // === МАТЕМАТИКА СКИДКИ ===
  const subtotal = cart.items.reduce((sum, item) => {
    const currentVariant = item.product?.variants?.find(v => v.id === item.variant_id);
    const maxStock = currentVariant ? parseInt(currentVariant.stock, 10) : 0;
    const actualQuantity = item.quantity > maxStock ? maxStock : item.quantity;
    return sum + (Number(item.product?.base_price) || 0) * actualQuantity;
  }, 0);

  const discountPercent = appliedCoupon ? appliedCoupon.discount_percent : 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const finalTotal = Math.max(0, subtotal - discountAmount);


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
      {/* БЛОК ПРОМОКОДА */}
      <div className="coupon-section" style={{ margin: '25px 0', padding: '15px', border: '2px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Введите код (например, TOMSK2026)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            disabled={isChecking || appliedCoupon}
            style={{ padding: '10px', flex: 1, borderRadius: '6px', border: '2px solid #e2e8f0', textTransform: 'uppercase', color: '#000' }}
          />
          {!appliedCoupon ? (
            <button type="button" onClick={handleApplyCoupon} disabled={isChecking} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              {isChecking ? 'Проверка...' : 'Применить'}
            </button>
          ) : (
            <button type="button" onClick={handleRemoveCoupon} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              Удалить
            </button>
          )}
        </div>
        {couponError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px' }}>{couponError}</p>}
        {appliedCoupon && <p style={{ color: '#10b981', fontSize: '14px', marginTop: '6px', fontWeight: '600' }}>🎉 Промокод активирован! Скидка {appliedCoupon.discount_percent}%</p>}
      </div>

      {/* ИТОГОВЫЙ БЛОК С УЧЕТОМ СКИДКИ */}
      <div className="cart-summary-block" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '15px' }}>
        <p>Сумма товаров: <b>{subtotal.toLocaleString()} ₽</b></p>
        {appliedCoupon && <p style={{ color: '#10b981' }}>Скидка ({appliedCoupon.discount_percent}%): <b>-{discountAmount.toLocaleString()} ₽</b></p>}
        <h3 style={{ fontSize: '22px', marginTop: '10px' }}>Итого к оплате: <span style={{ color: '#3b82f6' }}>{finalTotal.toLocaleString()} ₽</span></h3>
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
