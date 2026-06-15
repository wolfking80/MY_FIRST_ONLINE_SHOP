import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UserManagement } from './UserManagement';
import { CategoryBrandManagement } from './CategoryBrandManagement';
import { AddProductForm } from './AddProductForm';
import './AdminDashboard.css';

export const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-dashboard">

      {/* БОКОВОЕ МЕНЮ */}
      <aside className="admin-sidebar">
        <h4>Панель управления</h4>

        <button
          onClick={() => setActiveTab('overview')}
          className={`sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          📊 Обзор магазина
        </button>

        <button
          onClick={() => setActiveTab('add_product')}
          className={`sidebar-btn ${activeTab === 'add_product' ? 'active' : ''}`}
        >
          📦 Добавить товар
        </button>

        <button
          onClick={() => setActiveTab('products_list')}
          className={`sidebar-btn ${activeTab === 'products_list' ? 'active' : ''}`}
        >
          📝 Управление товарами
        </button>

        <button
          onClick={() => setActiveTab('categories_brands')}
          className={`sidebar-btn ${activeTab === 'categories_brands' ? 'active' : ''}`}
        >
          🏷️ Категории и Бренды
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          👥 Пользователи
        </button>
      </aside>

      {/* ОСНОВНОЙ КОНТЕНТ В ЗАВИСИМОСТИ ОТ ВКЛАДКИ */}
      <main className="admin-content">
        <div className="admin-card">
          {activeTab === 'overview' && (
            <div>
              <h3>Добро пожаловать, {user.username}!</h3>
              <p>Здесь будет отображаться общая статистика: количество заказов, новые пользователи и актуальные остатки товаров на складе.</p>
            </div>
          )}

          {activeTab === 'add_product' && <AddProductForm />}

          {activeTab === 'products_list' && (
            <div>
              <h3>Управление товарами</h3>
              <p>Тут мы выведем таблицу всех товаров с кнопками [Редактировать количество], [Удалить], [Изменить цену].</p>
            </div>
          )}

          {activeTab === 'categories_brands' && <CategoryBrandManagement />}

          {activeTab === 'users' && <UserManagement currentUser={user} />}
        </div>
      </main>

    </div>
  );
};
