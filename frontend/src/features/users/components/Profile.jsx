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
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Личный кабинет</h1>
      <div style={{ border: '1px solid #646cff', padding: '20px', display: 'inline-block' }}>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Имя:</strong> {user.first_name || 'Не указано'}</p>
        <button onClick={handleLogout} style={{ marginTop: '20px' }}>Выйти</button>
      </div>
    </div>
  );
};
