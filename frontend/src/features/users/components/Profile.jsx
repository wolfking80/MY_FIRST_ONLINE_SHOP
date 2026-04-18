import './Auth.css';

import { useEffect, useState } from 'react';
import { getMe, logoutUser } from '../api';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMe().then(setUser).catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  if (!user) return <div>Загрузка...</div>;

  return (
    <div className="auth-container" style={{ maxWidth: '600px' }}>
      <h3>Личный кабинет</h3>

      <div className="auth-form" style={{ gap: '20px' }}>
        <div style={{ borderBottom: '1px solid #3f3f3f', paddingBottom: '10px' }}>
          <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Email</span>
          <div style={{ fontSize: '1.1rem', marginTop: '5px' }}>{user.email}</div>
        </div>

        <div style={{ borderBottom: '1px solid #3f3f3f', paddingBottom: '10px' }}>
          <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Имя и Фамилия</span>
          <div style={{ fontSize: '1.1rem', marginTop: '5px' }}>
            {user.first_name} {user.last_name}
          </div>
        </div>

        <div style={{ borderBottom: '1px solid #3f3f3f', paddingBottom: '10px' }}>
          <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Город</span>
          <div style={{ fontSize: '1.1rem', marginTop: '5px' }}>{user.city || 'Не указан'}</div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{
            background: user.is_superuser ? '#646cff' : '#3f3f3f',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem'
          }}>
            {user.is_superuser ? '💎 АДМИНИСТРАТОР' : '👤 ПОКУПАТЕЛЬ'}
          </span>
        </div>

        <button onClick={handleLogout} className="auth-button" style={{ background: '#ff4d4d' }}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
};
