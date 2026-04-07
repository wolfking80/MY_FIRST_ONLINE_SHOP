import axios from 'axios';

// Создаем экземпляр axios с базовыми настройками
const client = axios.create({
  // В Vite прокси настроен на /api, поэтому пишем его здесь
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;