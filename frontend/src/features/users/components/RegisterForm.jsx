import './Auth.css';

import { useState } from 'react';
import { createUser } from '../api';
import { Link, useNavigate } from 'react-router-dom';

export const RegisterForm = () => {
    // Инициализация - создание "пульта управления" навигацией
    const navigate = useNavigate();
    // Состояние для данных формы
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        city: ''
    });
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createUser(formData);
            // Переход в ЛК
            navigate('/profile');
        } catch (err) {
            // Если email или телефон уже заняты, FastAPI вернет ошибку, и она отобразится
            setMessage('❌ Ошибка: ' + (err.response?.data?.detail || 'Не удалось создать аккаунт'));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="auth-container">
            <h3>Регистрация</h3>
            <form onSubmit={handleSubmit} className="auth-form">
                <input
                    name="email" type="email" placeholder="Email (обязательно)"
                    value={formData.email} onChange={handleChange} required
                />
                <input
                    name="password" type="password" placeholder="Пароль (обязательно)"
                    value={formData.password} onChange={handleChange} required
                />
                <input
                    name="first_name" type="text" placeholder="Имя"
                    value={formData.first_name} onChange={handleChange}
                />
                <input
                    name="last_name" type="text" placeholder="Фамилия"
                    value={formData.last_name} onChange={handleChange}
                />
                <input
                    name="phone" type="text" placeholder="Телефон"
                    value={formData.phone} onChange={handleChange}
                />
                <input
                    name="city" type="text" placeholder="Город"
                    value={formData.city} onChange={handleChange}
                />

                <button type="submit" className="auth-button">
                    Создать аккаунт
                </button>
            </form>

            {message && (
                <div style={{ marginTop: '15px', color: '#ff4d4d', textAlign: 'center', fontSize: '0.9rem' }}>
                    {message}
                </div>
            )}

            <div className="auth-footer">
                <span>Уже есть аккаунт? </span>
                <Link to="/login" className="auth-link">
                    Войти
                </Link>
            </div>
        </div>
    );
};