import React, { useEffect, useState } from 'react';
import { getAdminProducts } from '../../products/api';
import { getAllUsers } from '../../users/api';
import { getOrdersStats } from '../../orders/api';

export const AdminOverview = ({ currentUser }) => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    totalUsers: 0,
    outOfStockProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewStats = async () => {
      try {
        setLoading(true);

        // Запускаем все три запроса параллельно к базе данных
        const [users, products, orderStats] = await Promise.all([
          getAllUsers(),
          getAdminProducts(),
          getOrdersStats()
        ]);

        // Считаем дефицитные товары (где общие остатки по всем размерам = 0)
        const zeroStockCount = products.filter(p => {
          const totalStock = p.variants ? p.variants.reduce((sum, v) => sum + parseInt(v.stock || 0, 10), 0) : 0;
          return totalStock === 0;
        }).length;

        // Записываем ВСЕ реальные данные, пришедшие из PostgreSQL
        setStats({
          totalRevenue: orderStats.total_revenue,
          pendingOrders: orderStats.pending_orders,
          totalUsers: users.length,
          outOfStockProducts: zeroStockCount
        });

      } catch (err) {
        console.error("Ошибка при сборке статистики:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverviewStats();
  }, []);

  if (loading) return <div>Загрузка аналитики...</div>;

  return (
    <div className="admin-overview-panel">
      <h3 style={{ color: '#111827', margin: 0 }}>📊 Обзор магазина</h3>
      <p style={{ color: '#6e707e', fontSize: '15px', marginTop: '5px' }}>
        Привет, <strong>{currentUser.username}</strong>! Вот актуальная сводка по вашему бизнесу на сегодня:
      </p>

      {/* СЕТКА С КАРТОЧКАМИ */}
      <div className="dashboard-grid">

        {/* КАРТОЧКА ОБОРOТА */}
        <div className="stat-card revenue">
          <div>
            <div className="stat-title">Выручка (Всего)</div>
            <div className="stat-value">{stats.totalRevenue.toLocaleString()} ₽</div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        {/* КАРТОЧКА ЗАКАЗОВ */}
        <div className="stat-card orders">
          <div>
            <div className="stat-title">Новые заказы</div>
            <div className="stat-value">{stats.pendingOrders} шт.</div>
          </div>
          <div className="stat-icon">📦</div>
        </div>

        {/* КАРТОЧКА КЛИЕНТОВ */}
        <div className="stat-card users">
          <div>
            <div className="stat-title">Всего клиентов</div>
            <div className="stat-value">{stats.totalUsers} чел.</div>
          </div>
          <div className="stat-icon">👥</div>
        </div>

        {/* КАРТОЧКА ДЕФИЦИТА */}
        <div className="stat-card alert">
          <div>
            <div className="stat-title">Закончился товар</div>
            <div className="stat-value">{stats.outOfStockProducts} поз.</div>
          </div>
          <div className="stat-icon">⚠️</div>
        </div>

      </div>

      <div className="quick-actions-box">
        <h4>💡 Быстрые действия для администратора:</h4>
        <p>
          • Если в карточке <span style={{ color: '#c53030', fontWeight: '700' }}>Закончился товар</span> цифра больше нуля — перейдите во вкладку <strong>«Управление товарами»</strong> и обновите остатки на складе.<br />
          • Чтобы расширить ассортимент, используйте вкладки создания категорий, брендов и карточек товаров.
        </p>
      </div>
    </div>
  );
};
