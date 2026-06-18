import React, { useEffect, useState } from 'react';
import { adminGetAllOrders, adminUpdateOrderStatus } from '../api';
import './OrdersManagement.css';

export const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllOrders = async () => {
    try {
      const data = await adminGetAllOrders();
      setOrders(data);
    } catch (err) {
      console.error("Ошибка загрузки заказов админом:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOrders();
  }, []);

  const changeStatus = async (orderId, nextStatus) => {
    try {
      await adminUpdateOrderStatus(orderId, nextStatus);
      alert(`🚀 Статус заказа №${orderId} успешно изменен!`);
      loadAllOrders(); // Мгновенно обновляем список из базы данных
    } catch (err) {
      alert("Ошибка изменения статуса: " + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <div>Загрузка панели заказов...</div>;

  return (
    <div>
      <h3 className="admin-orders-title">
        🛍️ Управление заказами покупателей ({orders.length})
      </h3>

      {orders.length === 0 ? (
        <p className="admin-orders-empty">На сайте пока нет оформленных заказов.</p>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => (
            <div key={order.id} className="admin-order-card">

              {/* Шапка карточки */}
              <div className="admin-order-card-header">
                <span className="admin-order-id-link">Заказ №{order.id} (Покупатель ID: {order.user_id})</span>
                <span className={`admin-order-status-badge ${order.status === 'delivered' ? 'delivered' : 'pending'}`}>
                  {order.status === 'delivered' ? '✓ Доставлен' : `⏳ ${order.status}`}
                </span>
              </div>

              {/* Данные клиента */}
              <div className="admin-order-contacts">
                <div><strong>📞 Телефон:</strong> {order.contact_phone}</div>
                <div><strong>📍 Адрес доставки:</strong> {order.shipping_address}</div>
                {order.customer_comment && (
                  <div className="admin-order-comment"><strong>💬 Комментарий:</strong> {order.customer_comment}</div>
                )}
              </div>

              {/* Состав товаров из снапшотов */}
              <div className="admin-order-items-snapshot">
                {order.items?.map((item, idx) => (
                  <div key={idx}>
                    • {item.product_name_snapshot} ({item.product_sku_snapshot}) — <strong>{item.quantity} шт.</strong>
                  </div>
                ))}
              </div>

              {/* Подвал карточки */}
              <div className="admin-order-card-footer">
                <span className="admin-order-total-price">
                  Сумма к оплате: {Number(order.total_amount).toLocaleString()} ₽
                </span>

                {order.status !== 'delivered' && (
                  <button
                    type="button"
                    onClick={() => changeStatus(order.id, 'delivered')}
                    className="btn-admin-order-deliver"
                  >
                    🚚 Отметить как ДОСТАВЛЕН
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
