from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import String, Boolean, DateTime, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.features.carts.models import Cart
    from app.features.orders.models import Order
    from app.features.products.models import Product, Review


class User(Base):
    __tablename__ = "users"

    # === ОСНОВНЫЕ ПОЛЯ ===
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # === СТАТУСЫ И РОЛИ ===
    role: Mapped[str] = mapped_column(String(20), default="customer", server_default="customer")
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)

    # === ПРОФИЛЬ ===
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(20), unique=True)
    city: Mapped[str | None] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    shipping_address: Mapped[str | None] = mapped_column(Text)
    billing_address: Mapped[str | None] = mapped_column(Text)

    # === АУДИТ ===
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    login_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    # === СВЯЗИ ===
    # Заказы
    orders: Mapped[List["Order"]] = relationship(back_populates="user")
    # Отзывы
    reviews: Mapped[List["Review"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    # Избранное (Many-to-Many)
    favorites: Mapped[List["Product"]] = relationship(secondary="favorites", back_populates="favorited_by")
    # Корзина
    cart: Mapped["Cart"] = relationship(back_populates="user", uselist=False)

    @property
    def full_name(self) -> str:
        if self.first_name and self.last_name: return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.username