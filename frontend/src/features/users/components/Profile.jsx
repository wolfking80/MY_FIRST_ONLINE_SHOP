import React, { useState, useEffect } from 'react';
import { payOrder } from '../../orders/api';
import { useNavigate } from 'react-router-dom';
import { getMe, logoutUser, updateUserProfile, getUserOrders } from '../api';
import './Profile.css';

export const Profile = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]); // Стейт для хранения истории покупок
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    city: ''
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const navigate = useNavigate();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedOrderToPay, setSelectedOrderToPay] = useState(null);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvc: '' });


  // Глобальная загрузка данных пользователя и его заказов при открытии страницы
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        // 1. Получаем текущую сессию пользователя
        const userData = await getMe();
        setUser(userData);

        // Предзаполняем поля формы редактирования
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone: userData.phone || '',
          city: userData.city || ''
        });

        // Сразу же стягиваем историю его заказов из PostgreSQL
        try {
          const ordersData = await getUserOrders();
          setOrders(ordersData);
        } catch (orderErr) {
          console.error("Не удалось подгрузить заказы:", orderErr);
        }

      } catch (err) {
        console.error("Ошибка авторизации профиля:", err);
        navigate('/login'); // Если токен протух — отправляем авторизоваться
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Сохранение обновленной анкеты в базу данных
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      const response = await updateUserProfile(formData);
      alert("🎉 Личные данные успешно сохранены!");
      setUser(response.user); // Обновляем локальное состояние анкеты свежими данными
    } catch (err) {
      alert("Ошибка сохранения: " + (err.response?.data?.detail || err.message));
    } finally {
      setSaveLoading(false);
    }
  };

  // Выход из системы
  const handleLogout = async () => {
    if (!window.confirm("Вы действительно хотите выйти из аккаунта?")) return;
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error("Ошибка при выходе:", err);
      navigate('/login');
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontWeight: '600' }}>Загрузка личного кабинета...</div>;
  if (!user) return null;


  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvc) {
      alert("Пожалуйста, заполните все поля банковской карты!");
      return;
    }
    try {
      await payOrder(selectedOrderToPay);
      alert("🎉 Оплата прошла успешно! Деньги списаны, статус заказа обновлен.");
      setIsPayModalOpen(false);
      setCardForm({ number: '', expiry: '', cvc: '' });

      // Мгновенно перезагружаем данные профиля, чтобы плашка переключилась в "Оплачен"
      window.location.reload();
    } catch (err) {
      alert("Ошибка платежной системы: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="profile-container">
      <h2 className="profile-title">👤 Личный кабинет пользователя</h2>

      <div className="profile-grid-layout">

        {/* ЛЕВАЯ ЧАСТЬ: ПРОСМОТР ТЕКУЩИХ ДАННЫХ */}
        <div className="profile-info-card">
          <div className="profile-header-meta">
            {/* Круглая авто-аватарка по первой букве логина */}
            <div className="profile-avatar-circle">
              {user.username ? user.username[0] : 'U'}
            </div>
            <div>
              <h4 className="profile-username-title">@{user.username}</h4>
              <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '700' }}>В сети 🟢</span>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', color: '#4e73df', margin: '0 0 12px 0' }}>📋 Ваша анкета</h3>
          <div className="info-data-row"><strong>Логин (ID: {user.id}):</strong> {user.username}</div>
          <div className="info-data-row"><strong>Email:</strong> {user.email}</div>
          <div className="info-data-row"><strong>Роль на сайте:</strong> <span style={{ textTransform: 'uppercase', fontWeight: '700', color: user.role === 'admin' ? '#4e73df' : '#1cc88a' }}>{user.role === 'admin' ? '💎 Админ' : '👤 Покупатель'}</span></div>
          <div className="info-data-row"><strong>Имя:</strong> {user.first_name || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Не указано</span>}</div>
          <div className="info-data-row"><strong>Фамилия:</strong> {user.last_name || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Не указано</span>}</div>
          <div className="info-data-row"><strong>Телефон:</strong> {user.phone || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Не привязан</span>}</div>
          <div className="info-data-row"><strong>Город доставки:</strong> {user.city || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Не выбран</span>}</div>
          <div className="info-data-row"><strong>Дата регистрации:</strong> {new Date(user.created_at).toLocaleDateString()}</div>

          <button onClick={handleLogout} className="btn-cart-remove" style={{ width: '100%', marginTop: '20px', textAlign: 'center' }}>
            🚪 Выйти из аккаунта
          </button>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: ФОРМА РЕДАКТИРОВАНИЯ ДАННЫХ */}
        <div>
          <form onSubmit={handleFormSubmit} className="profile-edit-form">
            <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>⚙️ Редактировать контакты</h3>

            <label>Ваше Имя:</label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="Введите имя" className="profile-input-field" />

            <label>Ваша Фамилия:</label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Введите фамилию" className="profile-input-field" />

            <label>Номер телефона:</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+7 (___) ___-__-__" className="profile-input-field" />

            <label>Город доставки:</label>
            <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Например, Томск" className="profile-input-field" />

            <button type="submit" disabled={saveLoading} className="btn-profile-save">
              {saveLoading ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </form>
        </div>

      </div>

      {/* --- СНИЗУ: ИСТОРИЯ ЗАКАЗОВ --- */}
      <div style={{ marginTop: '40px', borderTop: '2px solid #f3f4f6', paddingTop: '20px' }}>
        <h3 style={{ color: '#111827', marginBottom: '20px' }}>📦 История ваших заказов ({orders.length})</h3>

        {orders.length === 0 ? (
          <p style={{ color: '#858796', fontStyle: 'italic' }}>Вы еще не совершали покупок в нашем магазине. Самое время что-нибудь выбрать! 😉</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {orders.map((order) => (
              <div key={order.id} style={{ border: '1px solid #e3e6f0', borderRadius: '8px', padding: '15px', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: '700' }}>
                  <span style={{ color: '#4e73df' }}>Заказ №{order.id} от {new Date(order.created_at).toLocaleDateString()}</span>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#fff',
                    fontWeight: '700',
                    backgroundColor:
                      order.status === 'delivered' ? '#1cc88a' :
                        order.status === 'pending' ? '#f6c23e' :
                          order.status === 'confirmed' ? '#4e73df' :
                            order.status === 'shipped' ? '#36b9cc' : '#e74a3b'
                  }}>
                    {order.status === 'pending' && '⏳ Обрабатывается'}
                    {order.status === 'confirmed' && '📦 Подтвержден'}
                    {order.status === 'shipped' && '🚚 В пути'}
                    {order.status === 'delivered' && '✓ Доставлен'}
                    {order.status === 'cancelled' && '❌ Отменен'}
                  </span>
                </div>

                {/* Состав товаров внутри заказа */}
                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ padding: '4px 0', borderBottom: idx !== order.items.length - 1 ? '1px dashed #e3e6f0' : 'none' }}>
                      • {item.product?.name} — {item.quantity} шт. x {Number(item.price_at_purchase).toLocaleString()} ₽

                    </div>
                  ))}
                </div>

                {/* БЛОК ОПЛАТЫ И КНОПКА */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '10px 0', borderTop: '1px dashed #e3e6f0' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: order.payment_status === 'paid' ? '#1cc88a' : '#f6c23e', fontWeight: '600' }}>
                      {order.payment_status === 'paid' ? '✓ Оплачен' : '💳 Ожидает оплаты'}
                    </span>
                  </div>

                  {/* Кнопка "Оплатить" показывается только если заказ не оплачен и не отменен */}
                  {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => { setSelectedOrderToPay(order.id); setIsPayModalOpen(true); }}
                      style={{ padding: '6px 14px', backgroundColor: '#4e73df', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                      💳 Оплатить заказ
                    </button>
                  )}
                </div>

                <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: '700', color: '#111827' }}>
                  Итоговая сумма: <span style={{ color: '#1cc88a' }}>{Number(order.total_amount).toLocaleString()} ₽</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО СИМУЛЯЦИИ БАНКОВСКОГО ПЛАТЕЖА */}
      {isPayModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '360px', position: 'relative', color: '#111827' }}>
            <button onClick={() => setIsPayModalOpen(false)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>

            <h3 style={{ margin: '0 0 5px 0', color: '#111827' }}>💳 Безопасная оплата</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#858796' }}>Заказ №{selectedOrderToPay}. Симуляция шлюза интернет-эквайринга.</p>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px' }}>Номер карты:</label>
              <input type="text" required maxLength="19" placeholder="4276 0000 0000 0000" value={cardForm.number} onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })} style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '6px', color: '#000' }} />

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Срок действия:</label>
                  <input type="text" required maxLength="5" placeholder="MM/YY" value={cardForm.expiry} onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })} style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '6px', width: '100%', boxSizing: 'border-box', color: '#000' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>CVC / CVV:</label>
                  <input type="password" required maxLength="3" placeholder="***" value={cardForm.cvc} onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })} style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '6px', width: '100%', boxSizing: 'border-box', color: '#000' }} />
                </div>
              </div>

              <button type="submit" style={{ padding: '12px', backgroundColor: '#1cc88a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '15px' }}>
                🚀 Списать средства
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
