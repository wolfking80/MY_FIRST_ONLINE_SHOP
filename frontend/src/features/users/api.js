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


export const loginUser = async (email, password) => {
  // Создаем объект URLSearchParams (это стандарт для OAuth2 в FastAPI)
  const params = new URLSearchParams();
  params.append('username', email); // Обязательно username!
  params.append('password', password);

  // Отправляем запрос
  const response = await apiClient.post('/auth/login', params, {
    headers: {
      // Это сообщает серверу, что данные приходят как из обычной формы
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};


export const logoutUser = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};


export const getMe = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};