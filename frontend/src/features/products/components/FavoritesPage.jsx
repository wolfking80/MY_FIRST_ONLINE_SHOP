import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserFavorites, toggleFavoriteProduct } from '../api';
import { addToCart } from '../../cart/api';
import './ProductList.css';

export const FavoritesPage = () => {
  const [favProducts, setFavProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavoritesList = async () => {
    try {
      setLoading(true);
      const data = await getUserFavorites();
      setFavProducts(data);
    } catch (err) {
      console.error("Ошибка загрузки избранного:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavoritesList();
  }, []);

  // Клик по сердечку на этой странице сразу удаляет товар из списка
  const handleRemoveFavorite = async (productId) => {
    try {
      await toggleFavoriteProduct(productId);
      setFavProducts(favProducts.filter(p => p.id !== productId)); // убираем из избранного
    } catch (err) {
      alert("Не удалось удалить из избранного: " + err.message);
    }
  };

  const handleBuyClick = async (productId) => {
    try {
      const prod = favProducts.find(p => p.id === productId);
      const variantId = prod?.variants && prod.variants.length > 0 ? prod.variants[0].id : null;

      const response = await addToCart(productId, variantId);
      alert(`🛒 Отлично! Товар добавлен в корзину (Всего: ${response.quantity} шт.)`);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      alert("Ошибка: " + (err.response?.data?.detail || "сервер недоступен"));
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontWeight: '600' }}>Загрузка избранного...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
      <h2 style={{ color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '25px' }}>
        ❤️ Ваша коллекция избранного ({favProducts.length})
      </h2>

      {favProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#858796' }}>
          <h3>Тут пока пусто 😔</h3>
          <p>Нажимайте на сердечки на главной странице, чтобы сохранять классные товары!</p>
          <Link to="/" style={{ color: '#4e73df', fontWeight: '700', textDecoration: 'none' }}>Перейти в каталог →</Link>
        </div>
      ) : (
        /* Рендерим точно такую же сетку товаров, как на главной витрине! */
        <div className="products-grid">
          {favProducts.map((product) => {
            const hasImage = product.images && product.images.length > 0;
            const imageUrl = hasImage ? `http://localhost:8000${product.images[0].url}` : 'https://placeholder.com';

            return (
              <div key={product.id} className="product-card">

                {/* Активное красное сердечко, клик по которому стирает его из базы */}
                <button
                  type="button"
                  onClick={() => handleRemoveFavorite(product.id)}
                  className="btn-favorite-toggle active"
                  title="Удалить из избранного"
                >
                  ❤️
                </button>

                <Link to={`/products/${product.slug}`} className="product-image-container">
                  <img src={imageUrl} alt={product.name} className="product-image" />
                </Link>

                <div className="product-info">
                  <span className="product-brand-badge">{product.brand?.name || 'Без бренда'}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '13px', color: '#f59e0b', marginBottom: '6px' }}>
                    {'★'.repeat(product.average_rating ? Math.round(parseFloat(product.average_rating)) : 0)}
                    {'☆'.repeat(5 - (product.average_rating ? Math.round(parseFloat(product.average_rating)) : 0))}
                    <span style={{ color: '#858796', fontSize: '11px', marginLeft: '4px' }}>
                      ({product.reviews_count || 0})
                    </span>
                  </div>

                  <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h4 className="product-name" style={{ margin: '0 0 8px 0', fontSize: '15px' }}>{product.name}</h4>
                  </Link>

                  <div className="product-price-row">
                    <span className="product-price">{Number(product.base_price).toLocaleString()} ₽</span>
                  </div>

                  {product.total_stock > 0 ? (
                    <button className="add-to-cart-btn" onClick={() => handleBuyClick(product.id)}>
                      <span>🛒</span> В корзину
                    </button>
                  ) : (
                    <button className="add-to-cart-btn" disabled style={{ backgroundColor: '#4b5563', color: '#9ca3af', cursor: 'not-allowed' }}>
                      <span>❌</span> Нет в наличии
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
