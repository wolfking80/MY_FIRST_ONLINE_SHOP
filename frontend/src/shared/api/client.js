import axios from 'axios';

// Создаем экземпляр axios с базовыми настройками
const client = axios.create({
  // В Vite прокси настроен на /api, поэтому пишем его здесь
  baseURL: '/api',
  withCredentials: true,  // Говорим браузеру: "ПРИНИМАЙ И ОТПРАВЛЯЙ КУКИ" 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;