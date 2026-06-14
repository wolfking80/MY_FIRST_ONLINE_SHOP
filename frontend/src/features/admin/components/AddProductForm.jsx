import React, { useState, useEffect } from 'react';
import apiClient from '../../../shared/api/client'; // Централизованный клиент для отправки формы
import { getCategories, getBrands } from '../../products/api'; // Импортируем функции получения списков

export const AddProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    category_id: '',
    brand_id: '',
    description: ''
  });
  const [files, setFiles] = useState([]);

  // Стейты для хранения подгруженных категорий и брендов
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Подгружаем списки при открытии страницы формы
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files); // Сохраняем массив выбранных файлов
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    for (let i = 0; i < files.length; i++) {
      data.append('files', files[i]);
    }

    try {
      // Отправляем через готовый apiClient (он сам добавит куки администратора)
      const response = await apiClient.post('/products/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("Ответ сервера:", response.data);
      alert('Товар успешно добавлен!');

      // Очистка формы после успеха
      setFormData({ name: '', base_price: '', category_id: '', brand_id: '', description: '' });
      setFiles([]);
      e.target.reset(); // Сбросить поле выбора файлов

    } catch (err) {
      console.error("Ошибка при создании:", err);
      alert('Ошибка: ' + (err.response?.data?.detail || 'Сервер недоступен'));
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '500px', marginTop: '50px' }}>
      <h3>Добавление товара</h3>
      <form onSubmit={handleSubmit} className="auth-form">
        <input name="name" value={formData.name} placeholder="Название товара" onChange={handleChange} required />
        <input name="base_price" value={formData.base_price} type="number" placeholder="Цена" onChange={handleChange} required />

        {/* ВЫПАДАЮЩИЙ СПИСОК КАТЕГОРИЙ */}
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          required
          style={{ padding: '10px', margin: '5px 0', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
        >
          <option value="">-- Выберите категорию --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* ВЫПАДАЮЩИЙ СПИСОК БРЕНДОВ */}
        <select
          name="brand_id"
          value={formData.brand_id}
          onChange={handleChange}
          required
          style={{ padding: '10px', margin: '5px 0', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
        >
          <option value="">-- Выберите бренд --</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        <textarea name="description" value={formData.description} placeholder="Описание" onChange={handleChange} style={{ padding: '10px', borderRadius: '4px' }} />

        <div style={{ margin: '10px 0' }}>
          <label>Картинки товара:</label>
          <input type="file" multiple onChange={handleFileChange} accept="image/*" required />
        </div>

        <button type="submit" className="auth-button">Создать товар</button>
      </form>
    </div>
  );
};
