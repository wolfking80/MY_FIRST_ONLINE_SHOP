import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, toggleFavoriteProduct, getUserFavorites } from '../api';
import { addToCart } from '../../cart/api';
import './ProductList.css';

export const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Стейты для фильтрации и живого поиска
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Функция загрузки товаров с учетом выставленных параметров
  const loadCatalog = async () => {
    try {
      setLoading(true);
      const data = await getProducts({
        search: searchQuery,
        min_price: minPrice,
        max_price: maxPrice
      });
      setProducts(data);
    } catch (err) {
      console.error("Ошибка при загрузке товаров:", err);
    } finally {
      setLoading(false);
    }
  };

// Загружаем список ID избранных товаров для текущего юзера
  const loadFavorites = async () => {
    try {
      const favProducts = await getUserFavorites();
      setFavoriteIds(favProducts.map(p => p.id)); // Сохраняем только массив ID [12, 55, ...]
    } catch {
      setFavoriteIds([]); // Если гость или ошибка — оставляем пустым
    }
  };

  // Стартовая загрузка каталога и избранного
  useEffect(() => {
    loadFavorites();
  }, []);


  // Автоматически перезапускаем поиск при вводе текста или изменении цен
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadCatalog();
    }, 400); // Небольшая задержка в 400мс, чтобы не спамить базу при каждой нажатой букве

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, minPrice, maxPrice]);


  // Функция клика по сердечку (Добавить / Удалить)
  const handleFavoriteClick = async (productId) => {
    try {
      const response = await toggleFavoriteProduct(productId);
      if (response.is_favorite) {
        setFavoriteIds([...favoriteIds, productId]); // Добавляем в стейт, сердечко загорится красным
      } else {
        setFavoriteIds(favoriteIds.filter(id => id !== productId)); // Удаляем, сердечко потухнет
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Чтобы добавлять товары в избранное, нужно войти в аккаунт! 👤");
      } else {
        alert("Не удалось изменить статус избранного: " + (err.response?.data?.detail || err.message));
      }
    }
  };


  // Добавление в корзину прямо с витрины
  const handleBuyClick = async (productId) => {
    try {
      // Ищем первый доступный ID варианта (размера/цвета) этого товара
      const prod = products.find(p => p.id === productId);
      // Если вариантов нет или бэкенд их не отдал, шлем null, бэкенд подставит дефолт
      const variantId = prod?.variants && prod.variants.length > 0 ? prod.variants[0].id : null;

      const response = await addToCart(productId, variantId);
      alert(`🛒 Отлично! Товар добавлен в корзину (Всего: ${response.quantity} шт.)`);

      // Генерируем браузерное событие для мгновенного обновления счетчика в шапке сайта
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Чтобы добавить товар в корзину, необходимо войти в свой аккаунт! 👤");
      } else {
        alert("Не удалось добавить товар: " + (err.response?.data?.detail || "сервер недоступен"));
      }
    }
  };

  // Быстрый сброс всех фильтров в ноль
  const handleResetFilters = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="catalog-main-layout">

      {/* 🔍 ЛЕВАЯ КОЛОНКА: ПАНЕЛЬ УПРАВЛЕНИЯ ФИЛЬТРАМИ */}
      <aside className="filters-sidebar-box">

        {/* Поиск по названию */}
        <div className="filter-section-group">
          <h4 className="filter-group-title">🔍 Живой Поиск</h4>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Название товара..."
            className="input-filter-price"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Диапазон цен */}
        <div className="filter-section-group">
          <h4 className="filter-group-title">💰 Цена, ₽</h4>
          <div className="filter-price-inputs-row">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="От"
              className="input-filter-price"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="До"
              className="input-filter-price"
            />
          </div>
        </div>

        {/* Кнопка сброса */}
        <button
          type="button"
          onClick={handleResetFilters}
          className="btn-reset-all-filters"
        >
          🔄 Сбросить фильтры
        </button>
      </aside>

      {/* 📦 ПРАВАЯ КОЛОНКА: СЕТКА ВИТРИНЫ ТОВАРОВ */}
      <main>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', fontWeight: '700' }}>Загрузка товаров...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#858796', fontStyle: 'italic' }}>
            По вашему запросу ничего не найдено 😔 Попробуйте изменить параметры фильтров.
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => {
              const hasImage = product.images && product.images.length > 0;
              const imageUrl = hasImage
                ? `http://localhost:8000${product.images[0].url}`
                : 'https://placeholder.com';

              const isFav = favoriteIds.includes(product.id); // Проверяем, лайкнут ли товар  

              return (
                <div key={product.id} className="product-card">

                  {/* КНОПКА-СЕРДЕЧКО НАД ФОТО */}
                  <button 
                    type="button" 
                    onClick={() => handleFavoriteClick(product.id)}
                    className={`btn-favorite-toggle ${isFav ? 'active' : ''}`}
                    title={isFav ? "Удалить из избранного" : "Добавить в избранное"}
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>

                  <Link to={`/products/${product.slug}`} className="product-image-container">
                    <img src={imageUrl} alt={product.name} className="product-image" />
                  </Link>

                  <div className="product-info">
                    {/* Бренд */}
                    <span className="product-brand-badge">
                      {product.brand?.name || 'Без бренда'}
                    </span>

                    {/* ⭐ ОТОБРАЖЕНИЕ РЕЙТИНГА И ЗВЕЗДОЧЕК */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '13px', color: '#f59e0b', marginBottom: '6px' }}>
                      {'★'.repeat(product.average_rating ? Math.round(parseFloat(product.average_rating)) : 0)}
                      {'☆'.repeat(5 - (product.average_rating ? Math.round(parseFloat(product.average_rating)) : 0))}

                      <span style={{ color: '#858796', fontSize: '11px', marginLeft: '4px' }}>
                        ({product.reviews_count || 0})
                      </span>
                    </div>

                    {/* Название */}
                    <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h4 className="product-name" style={{ margin: '0 0 8px 0', fontSize: '15px' }}>{product.name}</h4>
                    </Link>

                    {/* Цена */}
                    <div className="product-price-row">
                      <span className="product-price">{Number(product.base_price).toLocaleString()} ₽</span>
                    </div>

                    {/* Динамическая кнопка в зависимости от total_stock */}
                    {product.total_stock > 0 ? (
                      <button className="add-to-cart-btn" onClick={() => handleBuyClick(product.id)}>
                        <span>🛒</span> В корзину
                      </button>
                    ) : (
                      <button
                        className="add-to-cart-btn"
                        disabled
                        style={{ backgroundColor: '#4b5563', color: '#9ca3af', cursor: 'not-allowed' }}
                      >
                        <span>❌</span> Нет в наличии
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
};
