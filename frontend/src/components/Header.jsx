import React from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

export const Header = ({ user, setUser, cartCount }) => {
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

        {/* ПРОВЕРКА: Показываем Профиль, Корзину и Выход только ЗАЛОГИНЕННОМУ пользователю */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

            {/* 1. КОРЗИНА */}
            <Link to="/cart" className="header-cart-link" style={{ textDecoration: 'none', color: '#111827', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
              <span>🛒</span> Корзина {cartCount > 0 && <strong style={{ color: '#4e73df' }}>({cartCount})</strong>}
            </Link>

            {/* 2. ИНФО О ПОЛЬЗОВАТЕЛЕ (Имя стало кликабельной ссылкой на профиль!) */}
            <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to="/profile"
                title="Перейти в личный кабинет"
                style={{ textDecoration: 'none', color: '#111827', fontWeight: '700', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#4e73df'}
                onMouseLeave={(e) => e.target.style.color = '#111827'}
              >
                👤 {user.username || user.email}
              </Link>

              <button onClick={handleLogout}>Выйти</button>
            </div>

          </div>
        ) : (
          /* Если пользователь ГОСТЬ — показываем только Войти / Регистрация */
          <div className="auth-btns">
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </div>
        )}
      </div>
    </header>
  );
};
