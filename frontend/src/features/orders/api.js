import apiClient from '../../shared/api/client';

// Получить реальную аналитику по заказам из базы данных
export const getOrdersStats = async () => {
  const response = await apiClient.get('/orders/orders-stats');
  return response.data;
};


// Отправить данные формы для создания заказа
export const checkoutOrder = async (orderData) => {
  const response = await apiClient.post('/orders/checkout', orderData);
  return response.data;
};