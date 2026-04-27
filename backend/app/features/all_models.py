# Импортируем все модели, чтобы SQLAlchemy выстроила карту связей
from app.features.users.models import User
from app.features.products.models import Product, Category, Brand, ProductVariant, ProductImage, Review, Favorite
from app.features.orders.models import Order, OrderItem
from app.features.carts.models import Cart, CartItem

# Этот список можно использовать для отладки или в env.py
__all__ = [
    "User",
    "Product",
    "Category",
    "Brand",
    "ProductVariant",
    "ProductImage",
    "Review",
    "Favorite",
    "Order",
    "OrderItem",
    "Cart",
    "CartItem",
]