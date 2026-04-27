from datetime import datetime
from sqlalchemy import ForeignKey, Integer, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING, List
from app.core.database import Base

if TYPE_CHECKING:
    from app.features.users.models import User

class Cart(Base):
    __tablename__ = "carts"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    status: Mapped[str] = mapped_column(default="active")
    converted_to_order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(onupdate=func.now())
    
    user: Mapped["User"] = relationship(back_populates="cart")
    
    items: Mapped[List["CartItem"]] = relationship(back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"
    
    __table_args__ = (
        # Уникальность: товар+вариант могут быть в корзине только один раз
        UniqueConstraint('cart_id', 'product_id', 'variant_id', name='uq_cart_product_variant'),
        Index('idx_cart_user', 'user_id'),  # Если нужен быстрый поиск без join с Cart
    )
    
    id: Mapped[int] = mapped_column(primary_key=True)
    cart_id: Mapped[int] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)  # Денормализация для скорости
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    variant_id: Mapped[int | None] = mapped_column(ForeignKey("product_variants.id", ondelete="CASCADE"))
    quantity: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    
    # Связи
    cart: Mapped["Cart"] = relationship(back_populates="items")