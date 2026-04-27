from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List
from sqlalchemy import Integer, String, ForeignKey, Numeric, Text, func, DateTime, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.features.users.models import User
    from app.features.products.models import Product



class Order(Base):
    __tablename__ = "orders"
    
    __table_args__ = (
        Index('idx_orders_user_status', 'user_id', 'status'),
        Index('idx_orders_created_at', 'created_at'),
        Index('idx_orders_payment_status', 'payment_status'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    # === СТАТУСЫ ===
    # pending, confirmed, paid, shipped, delivered, cancelled
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    # pending, paid, failed, refunded
    payment_status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    
    # === ФИНАНСЫ ===
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    delivery_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    # === ДОСТАВКА И КОНТАКТЫ ===
    shipping_address: Mapped[str] = mapped_column(Text, nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient_name: Mapped[str | None] = mapped_column(String(255))
    tracking_number: Mapped[str | None] = mapped_column(String(100))
    
    # === ДОПОЛНИТЕЛЬНО ===
    customer_comment: Mapped[str | None] = mapped_column(Text)
    # История изменений статусов (лог): [{"status": "paid", "at": "...", "by": "system"}]
    status_history: Mapped[list | None] = mapped_column(JSON, default=list)
    
    # === ДАТЫ ===
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # === СВЯЗИ ===
    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")

    def calculate_total(self) -> Decimal:
        """
        Пересчитывает subtotal на основе позиций и вычисляет финальный total_amount.
        Возвращает итоговую сумму.
        """
        # Считаем сумму всех товаров в заказе
        items_sum = sum(item.total_price for item in self.items)
        
        self.subtotal = items_sum
        # Итоговая формула: Товары + Доставка - Скидка
        self.total_amount = self.subtotal + self.delivery_price - self.discount_amount
        
        return self.total_amount
    

class OrderItem(Base):
    __tablename__ = "order_items"
    
    __table_args__ = (
        Index('idx_order_item_order_product', 'order_id', 'product_id'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))
    variant_id: Mapped[int | None] = mapped_column(ForeignKey("product_variants.id", ondelete="SET NULL"))
    
    # === СНАПШОТЫ (Защита данных от изменений в каталоге) ===
    product_name_snapshot: Mapped[str] = mapped_column(String(255))
    product_sku_snapshot: Mapped[str | None] = mapped_column(String(100))
    
    # === ЦЕНЫ И КОЛИЧЕСТВО ===
    price_at_purchase: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False) # price * quantity
    
    # === СВЯЗИ ===
    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product | None"] = relationship()


    def __init__(self, **kwargs):
      super().__init__(**kwargs)
    # Считаем сумму позиции сразу при создании: цена * количество
      self.total_price = self.price_at_purchase * self.quantity
    