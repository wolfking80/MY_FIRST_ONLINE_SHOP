import React from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

export const Header = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Отправляем запрос на бэкенд, чтобы он удалил куку
      await axios.post('http://localhost:8000/api/v1/auth/logout', {}, {
        withCredentials: true
      });

      // Очищаем состояние в React
      setUser(null);

      // Редиректим на страницу логина
      navigate('/login');
    } catch (err) {
      console.error("Ошибка при выходе:", err);
      // Даже если бэкенд выдал ошибку, лучше очистить стейт локально
      setUser(null);
    }
  };

  return (
    <header className="main-header">
      <Link to="/" className="logo">🛒 MY ONLINE-SHOP</Link>
      <div className="nav-right">

        {/* Кнопка входа в админку только для админа/сотрудника */}
        {(user?.role === 'admin' || user?.role === 'employee') && (
          <Link to="/admin" className="admin-link">⚙️ Админка</Link>
        )}

        <Link to="/cart" className="header-cart-link" style={{ textDecoration: 'none', color: '#111827', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
          <span>🛒</span> Корзина
        </Link>

        {user ? (
          <div className="user-info">
            <span>👤 {user.username || user.email}</span>
            <button onClick={handleLogout}>Выйти</button>
          </div>
        ) : (
          <div className="auth-btns">
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </div>
        )}
      </div>
    </header>
  );
};

