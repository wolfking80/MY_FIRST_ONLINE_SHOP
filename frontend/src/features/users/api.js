import apiClient from '../../shared/api/client';


export const getAllUsers = async () => {
  const response = await apiClient.get('/users/');
  return response.data;
};


export const createUser = async (userData) => {
  // baseUrl уже содержит /api, а прокси заменит /api на /api/v1.
  // Поэтому здесь пишем просто /users/ (чтобы в сумме вышло /api/v1/users/)  
  const response = await apiClient.post('/users/', userData);
  // userData — это весь объект из формы
  return response.data;
};