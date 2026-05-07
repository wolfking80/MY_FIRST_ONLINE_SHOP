import React, { useState } from 'react';
import axios from 'axios';

export const AddProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    category_id: '',
    brand_id: '',
    description: ''
  });
  const [files, setFiles] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files); // Сохраняем массив выбранных файлов
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Отправка данных..."); // Проверка в консоли

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    for (let i = 0; i < files.length; i++) {
      data.append('files', files[i]);
    }

    try {
      const response = await axios.post('http://localhost:8000/api/v1/products/add', data, {
        withCredentials: true,
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
        <input name="name" placeholder="Название товара" onChange={handleChange} required />
        <input name="base_price" type="number" placeholder="Цена" onChange={handleChange} required />
        <input name="category_id" type="number" placeholder="ID Категории (твой 11)" onChange={handleChange} required />
        <input name="brand_id" type="number" placeholder="ID Бренда" onChange={handleChange} required />
        <textarea name="description" placeholder="Описание" onChange={handleChange} style={{ padding: '10px', borderRadius: '4px' }} />

        <div style={{ margin: '10px 0' }}>
          <label>Картинки товара:</label>
          <input type="file" multiple onChange={handleFileChange} accept="image/*" required />
        </div>

        <button type="submit" className="auth-button">Создать товар</button>
      </form>
    </div>
  );
};
