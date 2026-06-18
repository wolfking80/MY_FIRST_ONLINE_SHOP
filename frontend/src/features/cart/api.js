import apiClient from '../../shared/api/client';

// Отправка запроса на добавление товара в корзину
export const addToCart = async (productId, variantId = null) => {
  const response = await apiClient.post('/cart/add', {
    product_id: productId,
    variant_id: variantId
  });
  return response.data;
};


// Получить корзину текущего залогиненного пользователя
export const getUserCart = async () => {
  const response = await apiClient.get('/cart/');
  return response.data;
};

// Обновить количество товара в корзине
export const updateCartItemQuantity = async (itemId, newQuantity) => {
  // Передаем количество через query параметр ?quantity=X, как ждет FastAPI
  const response = await apiClient.patch(`/cart/items/${itemId}?quantity=${newQuantity}`);
  return response.data;
};

// Полностью удалить товар из корзины по ID записи cart_item
export const deleteCartItem = async (itemId) => {
  const response = await apiClient.delete(`/cart/items/${itemId}`);
  return response.data;
};