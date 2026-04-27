from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List
from sqlalchemy import String, Text, Numeric, ForeignKey, Boolean, JSON, func, Integer, CheckConstraint, Index, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.features.users.models import User
    from app.features.products.models import Product, Review


# === ТАБЛИЦА-СВЯЗКА ДЛЯ ИЗБРАННОГО (Association Table) ===
class Favorite(Base):
    __tablename__ = "favorites"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

# === БРЕНДЫ ===
class Brand(Base):
    __tablename__ = "brands"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    products: Mapped[List["Product"]] = relationship(back_populates="brand")

# === КАТЕГОРИИ ===
class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    
    products: Mapped[List["Product"]] = relationship(back_populates="category")
    subcategories: Mapped[List["Category"]] = relationship(
        back_populates="parent", 
        cascade="all, delete-orphan"
    )
    parent: Mapped["Category | None"] = relationship(
        back_populates="subcategories", 
        remote_side=[id],
        overlaps="subcategories"
    )

# === ТОВАРЫ ===
class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        # Уникальный индекс для быстрого поиска товара по URL
        Index('idx_product_slug', 'slug', unique=True),
        
        # Комбинированные индексы (для фильтров в каталоге)
        Index('idx_product_category_active', 'category_id', 'is_active'),
        Index('idx_product_brand_active', 'brand_id', 'is_active'),
        Index('idx_product_price_active', 'base_price', 'is_active'),
        
        # Одиночные индексы (для сортировок и топов)
        Index('idx_product_created_at', 'created_at'),
        Index('idx_product_rating', 'average_rating'),
    )
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    brand_id: Mapped[int | None] = mapped_column(ForeignKey("brands.id"), index=True)
    
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), index=True)
    is_active: Mapped[bool] = mapped_column(default=True, index=True)
    average_rating: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Связи
    brand: Mapped["Brand | None"] = relationship(back_populates="products")
    category: Mapped["Category"] = relationship(back_populates="products")
    variants: Mapped[List["ProductVariant"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    images: Mapped[List["ProductImage"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    reviews: Mapped[List["Review"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    favorited_by: Mapped[List["User"]] = relationship(secondary="favorites", back_populates="favorites")

# === ВАРИАНТЫ (РАЗМЕРЫ/ЦВЕТА) ===
class ProductVariant(Base):
    __tablename__ = "product_variants"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    stock: Mapped[int] = mapped_column(default=0)
    characteristics: Mapped[dict] = mapped_column(JSON) # {"color": "black", "size": "XL"}
    
    product: Mapped["Product"] = relationship(back_populates="variants")

# === ИЗОБРАЖЕНИЯ ===
class ProductImage(Base):
    __tablename__ = "product_images"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    url: Mapped[str] = mapped_column(String(500))
    is_main: Mapped[bool] = mapped_column(default=False)
    
    product: Mapped["Product"] = relationship(back_populates="images")

# === ОТЗЫВЫ ===
class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    rating: Mapped[int] = mapped_column(default=5)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    product: Mapped["Product"] = relationship(back_populates="reviews")
    user: Mapped["User"] = relationship(back_populates="reviews")
