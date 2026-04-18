import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
            {/* Путь для формы регистрации */}
            <Route path="/" element={<RegisterForm />} />
            {/* Путь для  формы авторизации */}
            <Route path="/login" element={<LoginForm />} />
            {/* Путь для личного кабинета */}
            <Route path="/profile" element={<Profile />} />
          </Routes>
          
        </main>
      </div>
    </Router>
  );
}

export default App;
