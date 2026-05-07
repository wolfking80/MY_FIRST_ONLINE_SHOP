import './Auth.css';

import { useState } from 'react';
import { loginUser } from '../api';
import { Link, useNavigate } from 'react-router-dom';

// Добавляем пропс onLoginSuccess
export const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Дожидаемся ответа от сервера (там теперь есть объект user)
      const response = await loginUser(email, password);

      console.log("Ответ сервера при логине:", response);
      
      // Вызываем функцию из App.jsx, передавая данные юзера
      if (onLoginSuccess) {
        onLoginSuccess(response.user); 
      }
      
      // Переходим в профиль
      navigate('/');
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.detail || 'Неверные данные'));
    }
  };

  return (
    <div className="auth-container">
      <h3>Вход</h3>
      <form onSubmit={handleSubmit} className="auth-form">
        <input 
          type="email" 
          name="email" 
          placeholder="Электронная почта" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Пароль" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" className="auth-button">Войти</button>
      </form>
      <div className="auth-footer">
        <span>Нет аккаунта? </span>
        <Link to="/register" className="auth-link">Зарегистрироваться</Link>
      </div>
    </div>
  );
};
