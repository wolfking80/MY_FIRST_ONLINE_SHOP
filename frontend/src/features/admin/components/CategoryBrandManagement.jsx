import React, { useState } from 'react';
import { createCategory, createBrand } from '../../products/api';

export const CategoryBrandManagement = () => {
  const [catName, setCatName] = useState('');
  const [brandName, setBrandName] = useState('');

  // Функция автогенерации слага (перевод кириллицы в транслит для URL)
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[а-яё]/g, char => {
        const mapping = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' };
        return mapping[char] || char;
      })
      .replace(/[^a-z0-9 -]/g, '') // удаляем спецсимволы
      .replace(/\s+/g, '-')        // пробелы в дефисы
      .replace(/-+/g, '-');        // убираем двойные дефисы
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      const slug = generateSlug(catName);
      await createCategory({ name: catName, slug });
      alert(`Категория "${catName}" успешно создана!`);
      setCatName('');
    } catch (err) {
      console.error(err);
      alert('Ошибка создания категории: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    try {
      const slug = generateSlug(brandName);
      await createBrand({ name: brandName, slug });
      alert(`Бренд "${brandName}" успешно создан!`);
      setBrandName('');
    } catch (err) {
      console.error(err);
      alert('Ошибка создания бренда: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '10px' }}>

      {/* ФОРМА КАТЕГОРИЙ */}
      <div className="admin-card" style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '20px' }}>🏷️ Создать Категорию</h3>
        <p style={{ color: '#6e707e', fontSize: '14px', marginBottom: '20px' }}>Добавление нового раздела товаров в каталог магазина.</p>

        <form onSubmit={handleAddCategory} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Название (например: Смартфоны)"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
          />
          <button type="submit" className="auth-button" style={{ padding: '10px', fontWeight: '600' }}>Добавить категорию</button>
        </form>
      </div>

      {/* ФОРМА БРЕНДОВ */}
      <div className="admin-card" style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '20px' }}>🏢 Создать Бренд</h3>
        <p style={{ color: '#6e707e', fontSize: '14px', marginBottom: '20px' }}>Регистрация торговой марки или производителя товаров.</p>

        <form onSubmit={handleAddBrand} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Название (например: Xiaomi)"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
          />
          <button type="submit" className="auth-button" style={{ padding: '10px', fontWeight: '600' }}>Добавить бренд</button>
        </form>
      </div>

    </div>
  );
};
