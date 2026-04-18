import { useState } from 'react';
import { loginUser } from '../api';
import { Link, useNavigate } from 'react-router-dom';

export const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      navigate('/profile');
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.detail || 'Неверные данные'));
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: 'auto' }}>
      <h3>Вход</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Войти</button>
      </form>

      <div style={{ marginTop: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
        <span>Нет аккаунта? </span>
        <Link to="/" style={{ color: '#646cff', textDecoration: 'none', fontWeight: 'bold' }}>
          Зарегистрироваться
        </Link>
      </div>

    </div>
  );
};