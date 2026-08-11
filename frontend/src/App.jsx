import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdminDashboard } from './features/admin/components/AdminDashboard';
import { AddProductForm } from './features/admin/components/AddProductForm';
import { FavoritesPage } from './features/products/components/FavoritesPage';
import { ProductList } from './features/products/components/ProductList';
import { Profile } from './features/users/components/Profile';
import { RegisterForm } from './features/users/components/RegisterForm'; // Импорт формы регистрации
import { LoginForm } from './features/users/components/LoginForm';   // Импорт формы авторизации
import { CartPage } from './features/cart/components/CartPage.jsx';
import { ProductDetailsPage } from './features/products/components/ProductDetailsPage.jsx';
import './App.css';


function App() {
  // Создаем стейт для хранения данных юзера
  const [user, setUser] = useState(null);

  // Создаем состояние для количества товаров в корзине
  const [cartCount, setCartCount] = useState(0);

  // Этот код срабатывает ОДИН РАЗ сразу при открытии или обновлении сайта
  useEffect(() => {

    // Вспомогательная функция для запроса точного количества товаров
    const updateCartCount = async () => {
      try {
        const cartRes = await axios.get('http://localhost:8000/api/v1/cart/', { withCredentials: true });
        const totalItems = cartRes.data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(totalItems);
      } catch {
        setCartCount(0); // Если корзины нет или гость — сбрасываем в 0
      }
    };

    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/users/me', {
          withCredentials: true // Говорим браузеру: "Возьми куку с собой"
        });
        // Если кука правильная, бэкенд вернет юзера, и мы его сохраним
        setUser(response.data);

        // Если юзер залогинен, сразу подтягиваем его счётчик корзины в шапку при старте
        await updateCartCount();

      } catch (err) {
        // Если куки нет или она истекла, просто оставляем user = null
        setUser(null);
        setCartCount(0);
      }
    };
    fetchUser();

  // Слушатель события для мгновенного обновления цифры при кликах «В корзину»
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []); // Пустые скобки значат: "выполни при загрузке"

  return (
    <Router>
      <div className="App">
        {/* Вставляем Шапку и передаем ей юзера и количество товаров в корзине */}
        <Header user={user} setUser={setUser} cartCount={cartCount} />

        <main style={{ padding: '20px', minHeight: '80vh' }}>
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/register" element={<RegisterForm />} />
            {/* Передаем setUser в LoginForm, чтобы он "запомнил" вход */}
            <Route path="/login" element={<LoginForm onLoginSuccess={setUser} />} />
            <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
            <Route path="/admin/*" element={<AdminDashboard user={user} />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/products/:slug" element={<ProductDetailsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Routes>
        </main>

        {/* Вставляем Футер */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
