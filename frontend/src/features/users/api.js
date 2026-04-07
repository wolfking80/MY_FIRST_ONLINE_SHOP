import apiClient from '../../shared/api/client';


export const getAllUsers = async () => {
  const response = await apiClient.get('/users/');
  return response.data;
};


export const createUser = async (userData) => {
  const response = await apiClient.post('/users/', userData);
  // userData — это весь объект из формы
  return response.data;
};