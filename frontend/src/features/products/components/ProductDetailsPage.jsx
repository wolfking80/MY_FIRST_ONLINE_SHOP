import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProductDetails } from '../api';
import { addToCart } from '../../cart/api';
import './ProductDetailsPage.css'; // <-- ИМПОРТИРОВАЛИ ОТДЕЛЬНЫЙ ФАЙЛ СТИЛЕЙ

export const ProductDetailsPage = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        const data = await getProductDetails(slug);
        setProduct(data);

        if (data.variants && data.variants.length > 0) {
          const firstInStock = data.variants.find(v => parseInt(v.stock, 10) > 0);
          setSelectedVariantId(firstInStock ? firstInStock.id : data.variants[0].id);
        }
      } catch (err) {
        console.error("Ошибка загрузки деталей товара:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [slug]);

  const handleAddToCartClick = async () => {
    if (!selectedVariantId) {
      alert("Пожалуйста, выберите размер/вариант товара!");
      return;
    }
    try {
      const response = await addToCart(product.id, selectedVariantId);
      alert(`🛒 Отлично! Этот вариант добавлен в корзину (Всего: ${response.quantity} шт.)`);
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Чтобы добавить товар в корзину, необходимо войти в свой аккаунт! 👤");
      } else {
        alert("Ошибка: " + (err.response?.data?.detail || "сервер недоступен"));
      }
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontWeight: '600' }}>Загрузка карточки товара...</div>;
  if (!product) return <div style={{ padding: '50px', textAlign: 'center' }}>Товар не найден 😔</div>;

  const currentVariant = product.variants?.find(v => v.id === parseInt(selectedVariantId, 10));
  const currentStock = currentVariant ? parseInt(currentVariant.stock, 10) : 0;

  return (
    <div className="details-page-container">

      {/* ЛЕВАЯ КОЛОНКА: ГАЛЕРЕЯ КАРТИНОК */}
      <div>
        <div className="details-main-image-box">
          <img
            src={product.images && product.images.length > 0 ? `http://localhost:8000${product.images[activeImgIndex]?.url}` : 'https://placeholder.com'}
            alt={product.name}
            className="details-main-image"
          />
        </div>

        {product.images && product.images.length > 1 && (
          <div className="details-thumbnails-list">
            {product.images.map((img, index) => (
              <img
                key={img.id}
                src={`http://localhost:8000${img.url}`}
                alt="Превью"
                onClick={() => setActiveImgIndex(index)}
                className={`details-thumbnail-img ${activeImgIndex === index ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ПРАВАЯ КОЛОНКА: ИНФОРМАЦИЯ И ПОКУПКА */}
      <div className="details-info-column">
        <span className="details-meta-breadcrumbs">
           {product.category?.name} / {product.brand?.name || 'Без бренда'}
        </span>
        <h2 className="details-product-title">{product.name}</h2>

        {/* ⭐ РЕЙТИНГ */}
        <div className="details-rating-stars">
          {'★'.repeat(Math.round(product.average_rating || 5))}
          {'☆'.repeat(5 - Math.round(product.average_rating || 5))}
          <span className="details-rating-count">({product.reviews?.length || 0} отзывов)</span>
        </div>

        <div className="details-product-price">
          {Number(product.base_price).toLocaleString()} ₽
        </div>

        {/* СЕТКА ВЫБОРА РАЗМЕРОВ (ВАРИАНТОВ) */}
        {product.variants && product.variants.length > 0 && (
          <div className="details-variants-wrapper">
            <label className="details-variants-label">Выберите вариант / размер:</label>
            <div className="details-variants-grid">
              {product.variants.map(v => {
                const inStock = parseInt(v.stock, 10) > 0;
                const isSelected = selectedVariantId === v.id;

                // Динамические классы в зависимости от наличия и фокуса
                let variantClass = "btn-variant-select ";
                if (inStock) {
                  variantClass += "in-stock " + (isSelected ? "selected" : "");
                } else {
                  variantClass += "out-of-stock";
                }

                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!inStock}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={variantClass}
                  >
                    {v.characteristics?.size || 'Standard'} ({v.characteristics?.color || 'Standard'})
                  </button>
                );
              })}
            </div>

            <small className={`details-stock-hint ${currentStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
              {currentStock > 0 ? `🟢 В наличии на складе: ${currentStock} шт.` : '🔴 Товар данного размера закончился'}
            </small>
          </div>
        )}

        <p className="details-product-description">
          {product.description || 'Описание товара временно отсутствует.'}
        </p>

        <button
          onClick={handleAddToCartClick}
          disabled={currentStock === 0}
          className={`btn-details-buy-submit ${currentStock > 0 ? 'active' : 'disabled'}`}
        >
          {currentStock > 0 ? '🛒 Добавить в корзину' : '❌ Нет в наличии'}
        </button>
      </div>

    </div>
  );
};
