import React, { useEffect, useState } from 'react';
import { getUserCart, updateCartItemQuantity, deleteCartItem } from '../api';
import './CartPage.css'; // <-- ИМПОРТИРОВАЛИ ОТДЕЛЬНЫЙ ФАЙЛ СТИЛЕЙ

export const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleQuantityChange = async (item, change) => {
    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
      handleRemoveItem(item);
      return;
    }

    try {
      await updateCartItemQuantity(item.id, newQuantity);
      await loadCart();
    } catch (err) {
      alert("Не удалось изменить количество:\n" + (err.response?.data?.detail || err.message));
    }
  };

  const handleRemoveItem = async (item) => {
    if (!window.confirm(`Вы действительно хотите удалить "${item.product?.name}" из корзины?`)) return;

    try {
      await deleteCartItem(item.id);
      await loadCart();
    } catch (err) {
      alert("Не удалось удалить товар: " + (err.response?.data?.detail || err.message));
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

          const currentVariant = item.product?.variants?.find(v => v.id === item.variant_id);
          const maxStock = currentVariant ? parseInt(currentVariant.stock, 10) : 0;

          const displayQuantity = item.quantity > maxStock ? maxStock : item.quantity;
          const isMaxStockReached = item.quantity >= maxStock;

          return (
            <div key={item.id} className="cart-item-row">

              {/* 📸 Картинка товара через CSS */}
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

      <button type="button" className="btn-checkout-submit">
        Перейти к оформлению заказа
      </button>
    </div>
  );
};
