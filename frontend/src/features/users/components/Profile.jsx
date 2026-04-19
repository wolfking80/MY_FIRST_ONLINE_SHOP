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
    <div className="auth-container" style={{ maxWidth: '500px' }}>
      <h3>Личный кабинет</h3>
      
      <div className="auth-form">
        <div className="profile-info-item">
          <span className="profile-label">Email</span>
          <div className="profile-value">{user.email}</div>
        </div>

        <div className="profile-info-item">
          <span className="profile-label">Имя и Фамилия</span>
          <div className="profile-value">
            {user.first_name} {user.last_name}
          </div>
        </div>

        <div className="profile-info-item">
          <span className="profile-label">Город</span>
          <div className="profile-value">{user.city || 'Не указан'}</div>
        </div>

        <div className="status-badge-container">
          <span className={`status-badge ${user.is_superuser ? 'status-admin' : 'status-user'}`}>
            {user.is_superuser ? '💎 Администратор' : '👤 Покупатель'}
          </span>
        </div>

        <button onClick={handleLogout} className="auth-button button-logout">
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
};
