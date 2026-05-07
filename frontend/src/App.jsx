import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AddProductForm } from './features/admin/components/AddProductForm';
import { ProductList } from './features/products/components/ProductList';
import { Profile } from './features/users/components/Profile';
import { RegisterForm } from './features/users/components/RegisterForm'; // Импорт формы регистрации
import { LoginForm } from './features/users/components/LoginForm';   // Импорт формы авторизации
import './App.css';


function App() {
  return (
    <Router>
      <div className="App">
        <main style={{ padding: '40px' }}>
          <h1><span className="spinning-cart">🛒</span>MY ONLINE SHOP</h1>

          <Routes>
            {/* Главная страница — список товаров*/}
            <Route path="/" element={<ProductList />} />
            {/* Путь для формы регистрации */}
            <Route path="/register" element={<RegisterForm />} />
            {/* Путь для  формы авторизации */}
            <Route path="/login" element={<LoginForm />} />
            {/* Путь для личного кабинета */}
            <Route path="/profile" element={<Profile />} />
            {/* Путь для создания товара администратором */}
            <Route path="/admin/add-product" element={<AddProductForm />} />
          </Routes>
          
        </main>
      </div>
    </Router>
  );
}

export default App;
