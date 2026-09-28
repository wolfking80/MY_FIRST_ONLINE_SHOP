import apiClient from '../../shared/api/client';

// Получить все заказы покупателей (только для админа)
export const adminGetAllOrders = async () => {
  const response = await apiClient.get('/admin/orders/');
  return response.data;
};

// Обновить статус заказа по его ID
export const adminUpdateOrderStatus = async (orderId, newStatus) => {
  const response = await apiClient.patch(`/admin/orders/${orderId}/status?new_status=${newStatus}`);
  return response.data;
};

// Создание промокодов
export const adminCreateCoupon = async (couponData) => {
  const response = await apiClient.post('/products/coupons/create', couponData);
  return response.data;
};
