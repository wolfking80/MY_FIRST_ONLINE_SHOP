import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProductList.css'; // Если был файл стилей

export const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Обращаемся к нашему бэкенду
        const response = await axios.get('http://localhost:8000/api/v1/products/');
        setProducts(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке товаров:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="loading">Загрузка товаров...</div>;

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card">
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
          <div className="product-info">
            <h4 className="product-name">{product.name}</h4>
            <p className="product-price">{product.base_price.toLocaleString()} ₽</p>
            <button className="add-to-cart-btn">
              <span>🛒</span> Купить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
