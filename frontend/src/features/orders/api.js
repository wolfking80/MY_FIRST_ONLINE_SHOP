import apiClient from '../../shared/api/client'; // Проверьте количество точек, чтобы выйти к shared

// Получить реальную аналитику по заказам из базы данных
export const getOrdersStats = async () => {
  const response = await apiClient.get('/orders/orders-stats');
  return response.data;
};
