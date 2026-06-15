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

// --- ФУНКЦИИ СОЗДАНИЯ ПОД БЭКЕНД ---

// Создать новую категорию
export const createCategory = async (categoryData) => {
  // Передаем параметры в query string, так как FastAPI принимает их через параметры функции
  const response = await apiClient.post(`/products/categories?name=${encodeURIComponent(categoryData.name)}&slug=${encodeURIComponent(categoryData.slug)}`);
  return response.data;
};

// Создать новый бренд
export const createBrand = async (brandData) => {
  const response = await apiClient.post(`/products/brands?name=${encodeURIComponent(brandData.name)}&slug=${encodeURIComponent(brandData.slug)}`);
  return response.data;
};
