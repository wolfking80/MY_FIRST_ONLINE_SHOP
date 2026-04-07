import './RegisterForm.css';

import { useState } from 'react';
import { createUser } from '../api';

export const RegisterForm = () => {
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
            // Отправляем объект целиком в api.js
            const newUser = await createUser(formData);
            setMessage(`✅ Успех! Юзер ${newUser.email} создан.`);
            // Очистка формы
            setFormData({ email: '', password: '', first_name: '', last_name: '', phone: '', city: '' });
        } catch (err) {
            setMessage('❌ Ошибка: ' + (err.response?.data?.detail || 'Не удалось создать аккаунт'));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto', textAlign: 'left', color: 'white' }}>
            <h3>Регистрация на сайте</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input name="email" type="email" placeholder="Email (обязательно)" value={formData.email} onChange={handleChange} required />
                <input name="password" type="password" placeholder="Пароль (обязательно)" value={formData.password} onChange={handleChange} required />
                <input name="first_name" type="text" placeholder="Имя" value={formData.first_name} onChange={handleChange} />
                <input name="last_name" type="text" placeholder="Фамилия" value={formData.last_name} onChange={handleChange} />
                <input name="phone" type="text" placeholder="Телефон" value={formData.phone} onChange={handleChange} />
                <input name="city" type="text" placeholder="Город" value={formData.city} onChange={handleChange} />

                <button type="submit" style={{ padding: '10px', background: '#646cff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Зарегистрироваться
                </button>
            </form>
            {message && (
                <div className={`status-message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>
            )}
        </div>
    );
};