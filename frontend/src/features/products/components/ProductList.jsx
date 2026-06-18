import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../../shared/api/client'; // Централизованный клиент
import { getCategories, getBrands } from '../api'; // Подключаем функции из api.js
import { addToCart } from '../../cart/api';
import './ProductList.css';

export const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Стейты для хранения списков фильтров
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Стейты для выбранных пользователем фильтров
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  // Загружаем категории и бренды один раз при открытии страницы
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const catData = await getCategories();
        const brandData = await getBrands();
        setCategories(catData);
        setBrands(brandData);
      } catch (error) {
        console.error("Ошибка при загрузке фильтров каталога:", error);
      }
    };
    loadFilters();
  }, []);

  // Загружаем товары каждый раз, когда меняются выбранные фильтры
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Формируем query-параметры динамически, как ожидает FastAPI роут GET /
        const params = {};
        if (selectedCategory) params.category_id = selectedCategory;
        if (selectedBrand) params.brand_id = selectedBrand;

        // Делаем запрос через apiClient к эндпоинту /products/
        const response = await apiClient.get('/products/', { params });
        setProducts(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке товаров:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, selectedBrand]); // Следим за изменением фильтров

  const handleBuyClick = async (productId) => {
    try {
      const response = await addToCart(productId);
      alert(`🛒 Отлично! Товар добавлен в корзину (Всего: ${response.quantity} шт.)`);
    } catch (err) {
      console.error("Ошибка добавления в корзину:", err);
      if (err.response?.status === 401) {
        alert("Чтобы добавить товар в корзину, необходимо войти в свой аккаунт! 👤");
      } else {
        alert("Не удалось добавить товар: " + (err.response?.data?.detail || "сервер недоступен"));
      }
    }
  };

  return (
    <div className="catalog-container" style={{ padding: '20px' }}>

      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      <div className="filters-panel" style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center' }}>

        {/* Выбор категории */}
        <select
          className="modern-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
        >
          <option value="">Все категории</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Выбор бренда */}
        <select
          className="modern-select"
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
        >
          <option value="">Все бренды</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>

        {/* Кнопка сброса (показывается, если хоть один фильтр активен) */}
        {(selectedCategory || selectedBrand) && (
          <button
            onClick={() => { setSelectedCategory(''); setSelectedBrand(''); }}
            style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', background: '#f0f0f0', border: '1px solid #ccc' }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ */}
      {loading ? (
        <div className="loading">Загрузка товаров...</div>
      ) : products.length === 0 ? (
        <div className="no-products" style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
          Товары с такими фильтрами не найдены 😔
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">

              {/* Ссылка-переход по клику на изображение товара */}
              <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div className="product-image-container">
                  <img
                    className="product-image"
                    src={
                      product.images && product.images.length > 0
                        ? `http://localhost:8000${product.images[0].url}`
                        : 'https://placeholder.com'
                    }
                    alt={product.name}
                  />
                </div>
              </Link>

              <div className="product-info">
                {/* Отображение привязанного к товару бренда */}
                <span style={{ fontSize: '11px', color: '#858796', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  {product.brand?.name || 'Без бренда'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '13px', color: '#f59e0b', marginBottom: '6px' }}>
                  {/* Закрашенные звезды (если рейтинга нет — будет 0) */}
                  {'★'.repeat(product.average_rating ? Math.round(parseFloat(product.average_rating)) : 0)}
                  {/* Серые контуры звезд */}
                  {'☆'.repeat(5 - (product.average_rating ? Math.round(parseFloat(product.average_rating)) : 0))}
                  {/* Количество отзывов */}
                  <span style={{ color: '#858796', fontSize: '11px', marginLeft: '4px' }}>
                    ({product.average_rating > 0 ? 1 : 0})
                  </span>
                </div>

                {/* Ссылка-переход по клику на название товара */}
                <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h4 className="product-name" style={{ margin: '0 0 8px 0', fontSize: '15px' }}>{product.name}</h4>
                </Link>

                <p className="product-price">{Number(product.base_price).toLocaleString()} ₽</p>
                {/* Динамическая кнопка: если остаток 0 — блокируем её */}
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
          ))}
        </div>
      )}
    </div>
  );
};
