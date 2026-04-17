import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RegisterForm } from './features/users/components/RegisterForm'; // Импорт формы регистрации
import './App.css';


// Будущий Личный Кабинет
const Profile = () => (
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
    <h2>ТУТ СКОРО БУДЕТ ЛК ПОЛЬЗОВАТЕЛЯ</h2>
  </div>
);


function App() {
  return (
    <Router>
      <div className="App">
        <main style={{ padding: '40px' }}>
          <h1><span className="spinning-cart">🛒</span>MY ONLINE SHOP</h1>

          <Routes>
            {/* Путь для главной страницы */}
            <Route path="/" element={<RegisterForm />} />
            {/* Путь для личного кабинета */}
            <Route path="/profile" element={<Profile />} />
          </Routes>
          
        </main>
      </div>
    </Router>
  );
}

export default App;
