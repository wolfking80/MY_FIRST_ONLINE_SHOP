import { useEffect, useState } from 'react';
import { RegisterForm } from './features/users/components/RegisterForm'; // Импорт формы регистрации
import './App.css';

function App() {
  return (
    <div className="App">
      <main style={{ padding: '40px' }}>
        <h1><span className="spinning-cart">🛒</span>MY ONLINE SHOP</h1>
        {/* Выводим форму регистрации */}
        <RegisterForm/>
      </main>
    </div>
  );
}

export default App;
