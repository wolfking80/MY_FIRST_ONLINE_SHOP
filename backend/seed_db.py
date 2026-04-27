import asyncio
from datetime import datetime
import random
from decimal import Decimal
from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash

# Импортируем ВСЕ модели для регистрации связей
from app.features.users.models import User
from app.features.products.models import (
    Category, Brand, Product, ProductVariant, ProductImage, Review, Favorite
)
from app.features.orders.models import Order, OrderItem
from app.features.carts.models import Cart, CartItem

fake = Faker('ru_RU')

async def seed():
    async with AsyncSessionLocal() as session:
        print("🚀 Начинаем наполнение базы...")

        # 1. Создаем Администратора и тестовых покупателей
        admin = User(
            email="admin@example.com",
            username="admin",
            hashed_password=get_password_hash("Admin12345"),
            role="admin",
            is_verified=True,
            first_name="Главный",
            last_name="Админ",
            updated_at=datetime.now()
        )
        session.add(admin)
        
        customers = []
        for i in range(10):
            user = User(
                email=fake.unique.email(),
                username=fake.unique.user_name(),
                hashed_password=get_password_hash("User12345"),
                role="customer",
                is_verified=True,
                city=fake.city(),
                updated_at=datetime.now()
            )
            session.add(user)
            customers.append(user)
        
        await session.flush()

        # 2. Создаем пустые корзины для всех созданных пользователей
        # (Так как у нас связь 1-к-1, корзина должна быть у каждого)
        for u in [admin] + customers:
            cart = Cart(user_id=u.id, status="active", updated_at=datetime.now())
            session.add(cart)

        # 3. Категории
        categories = []
        cat_data = {
            "Электроника": ["Смартфоны", "Ноутбуки", "Наушники"],
            "Аксессуары": ["Чехлы", "Зарядки"],
            "Бытовая техника": ["Кофемашины", "Чайники"]
        }
        
        for parent_name, subs in cat_data.items():
            parent_cat = Category(name=parent_name, slug=fake.unique.slug())
            session.add(parent_cat)
            await session.flush()
            for sub_name in subs:
                sub_cat = Category(name=sub_name, slug=fake.unique.slug(), parent_id=parent_cat.id)
                session.add(sub_cat)
                categories.append(sub_cat)
        
        # 4. Бренды
        brands = []
        brand_names = ["Apple", "Samsung", "Sony", "Xiaomi", "Dell", "LG", "Asus"]
        for b_name in brand_names:
            brand = Brand(name=b_name, slug=b_name.lower())
            session.add(brand)
            brands.append(brand)
        
        await session.flush()

        # 5. Товары (50 штук)
        print("📦 Генерируем товары и отзывы...")
        for i in range(50):
            target_cat = random.choice(categories)
            target_brand = random.choice(brands)
            price = Decimal(random.randint(2000, 150000))
            
            product = Product(
                name=f"{target_brand.name} {fake.word().capitalize()} {random.randint(10, 500)}",
                slug=f"product-{i}-{random.randint(1000, 9999)}",
                description=fake.text(max_nb_chars=500),
                base_price=price,
                category_id=target_cat.id,
                brand_id=target_brand.id,
                is_active=True,
                average_rating=0.0
            )
            session.add(product)
            await session.flush()

            # Варианты
            for color in ["Space Gray", "Silver", "Midnight"]:
                variant = ProductVariant(
                    product_id=product.id,
                    sku=f"SKU-{product.id}-{color[:2].upper()}-{random.randint(100, 999)}",
                    price=price + Decimal(random.randint(0, 5000)),
                    stock=random.randint(0, 30),
                    characteristics={"color": color, "model_year": 2024}
                )
                session.add(variant)

            # Фиксированные картинки (3 на товар)
            for img_idx in range(3):
                img = ProductImage(
                    product_id=product.id,
                    url=f"https://picsum.photos/id/{(product.id % 500) + img_idx}/800/800",
                    is_main=(img_idx == 0)
                )
                session.add(img)

            # Отзывы и расчет среднего рейтинга
            ratings = []
            for _ in range(random.randint(1, 5)):
                rev_user = random.choice(customers)
                rating = random.randint(3, 5)
                ratings.append(rating)
                review = Review(
                    product_id=product.id,
                    user_id=rev_user.id,
                    rating=rating,
                    comment=fake.sentence(nb_words=12)
                )
                session.add(review)
            
            product.average_rating = round(sum(ratings) / len(ratings), 1)

        await session.commit()
        print("✅ Готово! База наполнена.")

if __name__ == "__main__":
    asyncio.run(seed())