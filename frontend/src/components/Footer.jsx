import React from 'react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} MY ONLINE SHOP. Все права защищены.</p>
        <div className="footer-links">
          <span>Помощь</span>
          <span>Контакты</span>
          <span>О нас</span>
        </div>
      </div>
    </footer>
  );
};
