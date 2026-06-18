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


// Получить вообще все товары для админки (включая неактивные и их варианты)
export const getAdminProducts = async () => {
  const response = await apiClient.get('/products/admin-all');
  return response.data;
};

// Удалить товар по ID
export const deleteProduct = async (productId) => {
  const response = await apiClient.delete(`/products/delete/${productId}`);
  return response.data;
};

// Редактировать товар и его варианты
export const editProduct = async (productId, updatedPayload) => {
  const data = new FormData();
  // Упаковываем данные в JSON строку в поле product_data
  data.append('product_data', JSON.stringify(updatedPayload));

  // Явно передаем заголовок multipart/form-data, чтобы apiClient не запутался
  const response = await apiClient.put(`/products/edit/${productId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};


// Получить полные детали товара по его slug (для детальной карточки)
export const getProductDetails = async (slug) => {
  const response = await apiClient.get(`/products/details/${slug}`);
  return response.data;
};
