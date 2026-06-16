import React, { useEffect, useState } from 'react';
import { getAdminProducts, deleteProduct, editProduct, getCategories, getBrands } from '../../products/api';

export const ProductsManagement = ({ currentUser }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Стейты для модального окна редактирования
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '', base_price: '', category_id: '', brand_id: '', description: '', is_active: true
  });
  const [editVariants, setEditVariants] = useState([]);

  const isAdmin = currentUser?.role === 'admin';

  const loadData = async () => {
    try {
      setLoading(true);
      const prodData = await getAdminProducts();
      const catData = await getCategories();
      const brandData = await getBrands();
      setProducts(prodData);
      setCategories(catData);
      setBrands(brandData);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (product) => {
    setEditingId(product.id);
    setEditFormData({
      name: product.name,
      base_price: product.base_price,
      category_id: product.category_id,
      brand_id: product.brand_id || '',
      description: product.description || '',
      is_active: product.is_active
    });

    const formattedVariants = product.variants.map(v => ({
      sku: v.sku,
      stock: v.stock,
      price: v.price || '',
      size: v.characteristics?.size || 'Standard',
      color: v.characteristics?.color || 'Standard'
    }));
    setEditVariants(formattedVariants.length > 0 ? formattedVariants : [{ sku: '', stock: '', price: '', color: '', size: '' }]);

    setIsModalOpen(true);
  };

  const handleDelete = async (productId, name) => {
    if (!window.confirm(`Вы уверены, что хотите НАВСЕГДА удалить товар "${name}"?`)) return;
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      alert('Товар удален!');
    } catch (err) {
      alert('Ошибка удаления: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({ ...editFormData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...editVariants];
    updated[index][name] = value;
    setEditVariants(updated);
  };

  const addVariantField = () => {
    setEditVariants([...editVariants, { sku: '', stock: '', price: '', color: '', size: '' }]);
  };

  const removeVariantField = (index) => {
    if (editVariants.length === 1) return;
    setEditVariants(editVariants.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const payload = { ...editFormData, variants: editVariants };
    try {
      await editProduct(editingId, payload);
      alert('Товар и все изменения вариантов успешно обновлены!');
      setIsModalOpen(false);
      loadData(); // Перезагружаем таблицу свежими данными
    } catch (err) {
      console.error("Полная ошибка бэкенда:", err.response?.data);

      // Разворачиваем ошибку бэкенда, если она пришла объектом
      let errorText = err.message;
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorText = err.response.data.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('\n');
        } else {
          errorText = err.response.data.detail;
        }
      }
      alert('Ошибка при сохранении:\n' + errorText);
    }
  };


  if (loading) return <div>Загрузка списка товаров...</div>;

  return (
    <div className="products-management-panel">
      <h3>📝 Управление товарами</h3>
      <p className="sub-info">Всего в базе данных: <strong>{products.length}</strong> позиций</p>

      <table className="users-table-container">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название товара</th>
            <th>Базовая цена</th>
            <th>Бренд</th>
            <th>Всего на складе</th>
            <th>Статус</th>
            <th className="actions-cell">Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const totalStock = p.variants ? p.variants.reduce((sum, v) => sum + parseInt(v.stock || 0, 10), 0) : 0;

            return (
              <tr key={p.id} className={!p.is_active ? 'blocked-user-row' : ''}>
                <td>{p.id}</td>
                <td className="user-name-cell">{p.name}</td>

                <td className="product-price-cell">{Number(p.base_price).toLocaleString()} ₽</td>
                <td className="product-brand-cell">{p.brand?.name || <span className="no-brand">Без бренда</span>}</td>

                <td className="product-stock-cell"><strong>{totalStock}</strong> шт.</td>

                <td>
                  {p.is_active ? (
                    <span className="status-badge active">Активен</span>
                  ) : (
                    <span className="status-badge blocked">Скрыт</span>
                  )}
                </td>
                <td className="actions-cell">
                  <button onClick={() => openEditModal(p)} className="btn-action btn-block" style={{ backgroundColor: '#4e73df', border: '1px solid #2e59d9', color: '#fff' }}>
                    ✏️ Редактировать
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} disabled={!isAdmin} className="btn-action btn-delete">
                    🗑️ Удалить
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" type="button" onClick={() => setIsModalOpen(false)}>✕</button>
            <h3 style={{ marginBottom: '20px', color: '#4e73df' }}>⚙️ Редактирование товара (ID: {editingId})</h3>

            <form onSubmit={handleSaveEdit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontWeight: '600' }}>Название товара:</label>
              <input name="name" value={editFormData.name} onChange={handleFormChange} required />

              <label style={{ fontWeight: '600' }}>Базовая цена (₽):</label>
              <input name="base_price" type="number" value={editFormData.base_price} onChange={handleFormChange} required />

              <label style={{ fontWeight: '600' }}>Категория:</label>
              <select name="category_id" value={editFormData.category_id} onChange={handleFormChange} required className="modern-select">
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>

              <label style={{ fontWeight: '600' }}>Бренд:</label>
              <select name="brand_id" value={editFormData.brand_id} onChange={handleFormChange} className="modern-select">
                <option value="">-- Без бренда --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              <label style={{ fontWeight: '600' }}>Описание:</label>
              <textarea name="description" value={editFormData.description} onChange={handleFormChange} rows="3" style={{ padding: '10px', borderRadius: '4px', border: '2px solid #e5e7eb' }} />

              <div className="checkbox-container" onClick={() => setEditFormData({ ...editFormData, is_active: !editFormData.is_active })}>
                <input type="checkbox" name="is_active" checked={editFormData.is_active} onChange={handleFormChange} className="modern-checkbox" onClick={(e) => e.stopPropagation()} />
                <label className="checkbox-label">Показывать товар в каталоге</label>
              </div>

              <div style={{ marginTop: '15px', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#4e73df' }}>📐 Размеры, цвета и остатки на складе</h4>
                {editVariants.map((v, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                    <input type="text" name="size" value={v.size} placeholder="Разм." onChange={(e) => handleVariantChange(index, e)} required style={{ padding: '5px' }} />
                    <input type="text" name="color" value={v.color} placeholder="Цвет" onChange={(e) => handleVariantChange(index, e)} required style={{ padding: '5px' }} />
                    <input type="number" name="stock" value={v.stock} min="0" placeholder="Кол-во" onChange={(e) => handleVariantChange(index, e)} required style={{ padding: '5px' }} />
                    <input type="text" name="sku" value={v.sku} placeholder="SKU" onChange={(e) => handleVariantChange(index, e)} style={{ padding: '5px' }} />
                    <button type="button" onClick={() => removeVariantField(index)} disabled={editVariants.length === 1} style={{ padding: '4px 8px', backgroundColor: '#e74a3b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                <button type="button" onClick={addVariantField} style={{ marginTop: '5px', padding: '6px 10px', backgroundColor: '#1cc88a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  ➕ Добавить вариант
                </button>
              </div>

              <button type="submit" className="auth-button" style={{ padding: '12px', marginTop: '10px', fontWeight: '700' }}>Сохранить изменения</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
