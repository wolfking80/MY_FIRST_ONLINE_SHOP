import React, { useState } from 'react';
import { adminCreateCoupon } from '../api';
import './OrdersManagement.css'; // Можно использовать те же стили

export const CouponsManagement = () => {
  const [couponForm, setCouponForm] = useState({ code: '', percent: '', validUntil: '2026-12-31T23:59' });
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.percent || !couponForm.validUntil) {
      alert("Пожалуйста, заполните все поля формы промокода!");
      return;
    }

    setIsCreatingCoupon(true);
    try {
      await adminCreateCoupon({
        code: couponForm.code.trim().toUpperCase(),
        discount_percent: parseInt(couponForm.percent, 10),
        valid_until: new Date(couponForm.validUntil).toISOString()
      });
      alert(`🎉 Промокод "${couponForm.code.toUpperCase()}" успешно создан!`);
      setCouponForm({ code: '', percent: '', validUntil: '2026-12-31T23:59' });
    } catch (err) {
      alert("Ошибка создания промокода:\n" + (err.response?.data?.detail || err.message));
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  return (
    <div className="admin-coupon-generator-box">
      <h4 className="coupon-generator-title">🎫 Генератор новых промокодов</h4>

      <form onSubmit={handleCreateCouponSubmit} className="coupon-generator-form">
        <div className="form-input-group flex-2">
          <label className="form-input-label">Код (слово):</label>
          <input
            type="text"
            placeholder="Например: AUTUMN26"
            value={couponForm.code}
            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
            className="coupon-form-input"
          />
        </div>

        <div className="form-input-group flex-1">
          <label className="form-input-label">Скидка (%):</label>
          <input
            type="number"
            min="1"
            max="100"
            placeholder="15"
            value={couponForm.percent}
            onChange={(e) => setCouponForm({ ...couponForm, percent: e.target.value })}
            className="coupon-form-input"
          />
        </div>

        <div className="form-input-group flex-2">
          <label className="form-input-label">Действует до:</label>
          <input
            type="datetime-local"
            value={couponForm.validUntil}
            onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
            className="coupon-form-input"
          />
        </div>

        <button type="submit" disabled={isCreatingCoupon} className="btn-create-coupon-submit">
          {isCreatingCoupon ? 'Создание...' : '➕ Создать купон'}
        </button>
      </form>
    </div>
  );
};
