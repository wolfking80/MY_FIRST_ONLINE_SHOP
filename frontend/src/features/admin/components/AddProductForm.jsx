import React, { useState, useEffect } from 'react';
import apiClient from '../../../shared/api/client';
import { getCategories, getBrands } from '../../products/api';

export const AddProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    category_id: '',
    brand_id: '',
    description: '',
    is_active: true
  });

  // Новый стейт для динамического списка вариантов
  const [variants, setVariants] = useState([
    { sku: '', stock: '', price: '', color: '', size: '' }
  ]);

  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const categoriesData = await getCategories();
        const brandsData = await getBrands();
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (err) {
        console.error("Ошибка при получении категорий или брендов:", err);
      }
    };
    loadFormData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // --- ФУНКЦИИ ДЛЯ ДИНАМИЧЕСКИХ ВАРИАНТОВ ---
  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const updatedVariants = [...variants];
    updatedVariants[index][name] = value;
    setVariants(updatedVariants);
  };

  const addVariantField = () => {
    setVariants([...variants, { sku: '', stock: '', price: '', color: '', size: '' }]);
  };

  const removeVariantField = (index) => {
    if (variants.length === 1) return; // Один вариант должен остаться всегда
    setVariants(variants.filter((_, i) => i !== index));
  };
  // ------------------------------------------

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Собираем общий объект для отправки в JSON
    const payload = {
      ...formData,
      variants: variants // Массив размеров и цветов
    };

    const data = new FormData();
    // Упаковываем весь payload в одну JSON строку, как ждет бэкенд
    data.append('product_data', JSON.stringify(payload));

    for (let i = 0; i < files.length; i++) {
      data.append('files', files[i]);
    }

    try {
      const response = await apiClient.post('/products/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Товар и все его варианты успешно добавлены!');

      // Сброс формы
      setFormData({ name: '', base_price: '', category_id: '', brand_id: '', description: '', is_active: true });
      setVariants([{ sku: '', stock: '', price: '', color: '', size: '' }]);
      setFiles([]);
      e.target.reset();

    } catch (err) {
      console.error("Ошибка при создании:", err);
      alert('Ошибка: ' + (err.response?.data?.detail || 'Сервер недоступен'));
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '650px', marginTop: '30px' }}>
      <h3>📦 Добавление товара и вариантов</h3>
      <form onSubmit={handleSubmit} className="auth-form">

        <input name="name" value={formData.name} placeholder="Название товара" onChange={handleChange} required />
        <input name="base_price" value={formData.base_price} type="number" placeholder="Базовая цена (₽)" onChange={handleChange} required />

        <select name="category_id" value={formData.category_id} onChange={handleChange} required className="modern-select">
          <option value="">-- Выберите категорию --</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>

        <select name="brand_id" value={formData.brand_id} onChange={handleChange} required className="modern-select">
          <option value="">-- Выберите бренд --</option>
          {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>

        <textarea name="description" value={formData.description} placeholder="Описание товара" onChange={handleChange} style={{ padding: '10px', borderRadius: '4px' }} />

        <div className="checkbox-container" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
          <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="modern-checkbox" onClick={(e) => e.stopPropagation()} />
          <label htmlFor="is_active" className="checkbox-label">Сразу активировать товар</label>
        </div>

        {/* СЕКЦИЯ СЕТКИ ВАРИАНТОВ (РАЗМЕРЫ / ЦВЕТА) */}
        <div style={{ marginTop: '25px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#4e73df' }}>📐 Размеры, цвета и остатки на складе</h4>

          {variants.map((variant, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <input type="text" name="size" value={variant.size} placeholder="Размер (XL, 42)" onChange={(e) => handleVariantChange(index, e)} required style={{ padding: '6px' }} />
              <input type="text" name="color" value={variant.color} placeholder="Цвет (Черный)" onChange={(e) => handleVariantChange(index, e)} required style={{ padding: '6px' }} />
              <input type="number" name="stock" value={variant.stock} min="0" placeholder="Кол-во" onChange={(e) => handleVariantChange(index, e)} required style={{ padding: '6px' }} />
              <input type="number" name="price" value={variant.price} placeholder="Цена (если др.)" onChange={(e) => handleVariantChange(index, e)} style={{ padding: '6px' }} />
              <input type="text" name="sku" value={variant.sku} placeholder="SKU (опция)" onChange={(e) => handleVariantChange(index, e)} style={{ padding: '6px' }} />

              <button
                type="button"
                onClick={() => removeVariantField(index)}
                disabled={variants.length === 1}
                style={{ padding: '6px 10px', backgroundColor: '#e74a3b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addVariantField}
            style={{ marginTop: '5px', padding: '8px 12px', backgroundColor: '#1cc88a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ➕ Добавить размер/вариант
          </button>
        </div>

        <div style={{ margin: '20px 0' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Картинки товара:</label>
          <input type="file" multiple onChange={handleFileChange} accept="image/*" required />
        </div>

        <button type="submit" className="auth-button" style={{ width: '100%', padding: '12px', fontSize: '16px' }}>Создать товар и варианты</button>
      </form>
    </div>
  );
};
