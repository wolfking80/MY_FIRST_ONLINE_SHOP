import apiClient from '../../shared/api/client';

// Получить список всех категорий для выпадающих списков и фильтров
export const getCategories = async () => {
  const response = await apiClient.get('/products/categories');
  return response.data;
};

// Получить список всех брендов для выпадающих списков и фильтров
export const getBrands = async () => {
  const response = await apiClient.get('/products/brands');
  return response.data;
};

// Получить список товаров с фильтрацией (для каталога)
export const getProducts = async (categoryId = null, brandId = null) => {
  const params = new URLSearchParams();
  if (categoryId) params.append('category_id', categoryId);
  if (brandId) params.append('brand_id', brandId);

  const response = await apiClient.get('/products/', { params });
  return response.data;
};
