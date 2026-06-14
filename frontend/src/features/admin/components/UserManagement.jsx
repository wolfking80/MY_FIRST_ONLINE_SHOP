import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUser, deleteUser } from '../../users/api';

export const UserManagement = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Ошибка при загрузке пользователей:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert('Роль успешно изменена!');
    } catch (err) {
      alert('Не удалось изменить роль: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Переключение блокировки (is_blocked: true/false)
  const handleToggleBlock = async (user) => {
    const nextBlockStatus = !user.is_blocked;
    const confirmMsg = nextBlockStatus
      ? `Заблокировать пользователя ${user.username}?`
      : `Разблокировать пользователя ${user.username}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      // Отправляем PATCH запрос
      const updatedUser = await updateUser(user.id, { is_blocked: nextBlockStatus });

      // Обновляем состояние в React данными, которые РЕАЛЬНО вернул сервер
      setUsers(users.map(u => u.id === user.id ? { ...u, is_blocked: updatedUser.is_blocked } : u));

      alert(updatedUser.is_blocked ? 'Пользователь заблокирован!' : 'Пользователь разблокирован!');
    } catch (err) {
      console.error("Ошибка при блокировке:", err);
      alert('Ошибка при изменении статуса блокировки: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (userId === currentUser.id) {
      alert('Вы не можете удалить самого себя!');
      return;
    }
    if (!window.confirm(`Вы уверены, что хотите НАВСЕГДА удалить пользователя ${username}?`)) return;

    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      alert('Пользователь удален');
    } catch (err) {
      alert('Ошибка при удалении: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <div className="loading">Загрузка списка пользователей...</div>;

  const isAdmin = currentUser?.role === 'admin'; // Проверяем, админ ли перед нами

  return (
    <div className="user-management-panel">
      <h3>👥 Управление пользователями</h3>
      <p className="sub-info">
        Всего зарегистрировано: <strong>{users.length}</strong> пользователей
      </p>

      <table className="users-table-container">
        <thead>
          <tr>
            <th>ID</th>
            <th>Пользователь</th>
            <th>Email / Телефон</th>
            <th>Роль</th>
            <th>Статус</th>
            <th className="actions-cell">Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={user.is_blocked ? 'blocked-user-row' : ''}>
              <td>{user.id}</td>
              <td className="user-name-cell">
                {user.username}
                {user.id === currentUser.id && <span className="user-me-badge">(Вы)</span>}
              </td>
              <td className="user-contacts">
                <div>{user.email}</div>
                <div className="phone-sub">{user.phone || 'Нет телефона'}</div>
              </td>
              <td>
                <select
                  value={user.role}
                  disabled={!isAdmin || user.id === currentUser.id}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="role-select"
                >
                  <option value="customer">Покупатель</option>
                  <option value="employee">Сотрудник</option>
                  <option value="admin">Администратор</option>
                </select>
              </td>
              <td>
                {user.is_blocked ? (
                  <span className="status-badge blocked">Заблокирован</span>
                ) : (
                  <span className="status-badge active">Активен</span>
                )}
              </td>
              <td className="actions-cell">
                <button
                  onClick={() => handleToggleBlock(user)}
                  disabled={!isAdmin || user.id === currentUser.id}
                  className={`btn-action ${user.is_blocked ? 'btn-unblock' : 'btn-block'}`}
                >
                  {user.is_blocked ? '🛑 Разблок.' : '🔒 Блок'}
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id, user.username)}
                  disabled={!isAdmin || user.id === currentUser.id}
                  className="btn-action btn-delete"
                >
                  🗑️ Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
