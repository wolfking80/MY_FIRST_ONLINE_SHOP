from decimal import Decimal 
import uuid

from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from slugify import slugify
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload, selectinload
from typing import List

from app.core.database import get_db
from app.features.products.models import (
    Brand,
    Category,
    Product,
    ProductImage,
    ProductVariant,
    Review,
)
from app.features.products.schemas import ProductShort
from app.features.products.utils import save_product_image
from app.features.users.dependencies import check_is_admin, check_is_staff, get_current_user
from app.features.users.models import User
from app.features.orders.models import Order, OrderItem

router = APIRouter(tags=["Catalog"])


@router.get("/", response_model=List[ProductShort])
async def get_products(
    skip: int = 0,
    limit: int = 20,
    category_id: int | None = None,
    brand_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    # Грузим товар + бренд + все картинки
    query = (
        select(Product)
        .options(joinedload(Product.brand), joinedload(Product.images))
        .where(Product.is_active == True)
    )

    if category_id:
        query = query.where(Product.category_id == category_id)
    if brand_id:
        query = query.where(Product.brand_id == brand_id)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    # unique() обязателен, когда используем joinedload с коллекциями (картинками)
    products = result.unique().scalars().all()

    return products


import json
from pydantic import BaseModel, Field


# Создаем мини-схему для валидации входящих вариантов прямо внутри JSON
class VariantInput(BaseModel):
    sku: str | None = None
    stock: int = 0
    price: Decimal | None = None
    color: str = "Standard"
    size: str = "Standard"


@router.post("/add", status_code=201)
async def admin_add_product(
    # Принимаем JSON-строку с данными товара и вариантов
    product_data: str = Form(
        ..., description="JSON строка с данными товара и вариантов"
    ),
    files: list[UploadFile] = File(..., description="Картинки товара"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(check_is_staff),
):
    try:
        # Парсим JSON из строки
        raw_data = json.loads(product_data)

        name = raw_data["name"]
        base_price = Decimal(str(raw_data["base_price"]))
        category_id = int(raw_data["category_id"])
        brand_id = int(raw_data["brand_id"]) if raw_data.get("brand_id") else None
        description = raw_data.get("description", "")
        is_active = bool(raw_data.get("is_active", True))

        # Список вариантов из фронтенда
        variants_list = raw_data.get("variants", [])

    except (json.JSONDecodeError, KeyError, ValueError) as e:
        raise HTTPException(
            status_code=400, detail=f"Неверный формат данных JSON: {str(e)}"
        )

    # Создаем базовый товар
    slug = slugify(name) + "-" + str(uuid.uuid4())[:4]
    new_product = Product(
        name=name,
        base_price=base_price,
        category_id=category_id,
        brand_id=brand_id,
        description=description,
        slug=slug,
        is_active=is_active,
    )
    db.add(new_product)
    await db.flush()  # Получаем id нового товара

    # Если админ не добавил ни одного варианта, создаем один дефолтный
    if not variants_list:
        variants_list = [
            {
                "sku": f"SKU-{new_product.id}-DEF",
                "stock": 0,
                "price": base_price,
                "color": "Standard",
                "size": "Standard",
            }
        ]

    # Циклом создаем все пришедшие варианты в базу данных
    for v in variants_list:
        # Если админ оставил цену варианта пустой, берем базовую цену товара
        v_price = Decimal(v["price"]) if v.get("price") else base_price
        v_sku = (
            v["sku"]
            if v.get("sku")
            else f"SKU-{new_product.id}-{str(uuid.uuid4())[:4].upper()}"
        )

        new_variant = ProductVariant(
            product_id=new_product.id,
            sku=v_sku,
            price=v_price,
            stock=int(v["stock"]),
            # Сохраняем цвет и размер в JSON-колонку characteristics модели
            characteristics={
                "color": v.get("color", "Standard"),
                "size": v.get("size", "Standard"),
            },
        )
        db.add(new_variant)

    # Сохраняем картинки
    for idx, file in enumerate(files):
        img_url = save_product_image(file)
        new_img = ProductImage(
            product_id=new_product.id, url=img_url, is_main=(idx == 0)
        )
        db.add(new_img)

    await db.commit()
    return {
        "status": "success",
        "id": new_product.id,
        "variants_count": len(variants_list),
    }


# Эндпоинт для быстрого создания категорий
@router.post("/categories", status_code=201)
async def create_category(name: str, slug: str, db: AsyncSession = Depends(get_db)):
    new_cat = Category(name=name, slug=slug)
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    return new_cat


# Эндпоинт для быстрого создания брендов
@router.post("/brands", status_code=201)
async def create_brand(name: str, slug: str, db: AsyncSession = Depends(get_db)):
    new_brand = Brand(name=name, slug=slug)
    db.add(new_brand)
    await db.commit()
    await db.refresh(new_brand)
    return new_brand


# Получить все категории (для выпадающего списка в React)
@router.get("/categories", status_code=200)
async def get_categories(db: AsyncSession = Depends(get_db)):
    query = select(Category)
    result = await db.execute(query)
    return result.scalars().all()


# Получить все бренды (для выпадающего списка в React)
@router.get("/brands", status_code=200)
async def get_brands(db: AsyncSession = Depends(get_db)):
    query = select(Brand)
    result = await db.execute(query)
    return result.scalars().all()


# Получить абсолютно все товары (активные и неактивные) для админки
@router.get("/admin-all", status_code=200)
async def admin_get_all_products(
    db: AsyncSession = Depends(get_db), admin: User = Depends(check_is_staff)
):
    query = (
        select(Product)
        .options(
            joinedload(Product.brand),
            joinedload(Product.images),
            joinedload(Product.variants),  # Обязательно грузим варианты
        )
        .order_by(Product.id.desc())
    )

    result = await db.execute(query)
    return result.unique().scalars().all()


# Удалить товар и все его связи из БД
@router.delete("/delete/{product_id}", status_code=200)
async def admin_delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_is_admin),  # Удалять может только админ!
):
    query = select(Product).where(Product.id == product_id)
    result = await db.execute(query)
    product = result.scalars().first()

    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    await db.delete(product)
    await db.commit()
    return {"status": "success", "message": "Товар успешно удален"}


# Полное редактирование товара и его вариантов (Принимаем JSON-строку)
import json
import uuid


@router.put("/edit/{product_id}", status_code=200)
async def admin_edit_product(
    product_id: int,
    product_data: str = Form(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(check_is_staff),
):
    # Находим товар в базе
    query = (
        select(Product)
        .options(joinedload(Product.variants))
        .where(Product.id == product_id)
    )
    result = await db.execute(query)
    product = result.scalars().first()

    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    try:
        raw_data = json.loads(product_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Неверный формат JSON")

    # Принудительное приведение типов, чтобы избежать ошибок валидации Pydantic/SQLAlchemy
    try:
        product.name = str(raw_data["name"])
        product.base_price = Decimal(str(raw_data["base_price"]))
        product.category_id = int(raw_data["category_id"])
        product.brand_id = (
            int(raw_data["brand_id"]) if raw_data.get("brand_id") else None
        )
        product.description = raw_data.get("description", "")
        product.is_active = bool(raw_data.get("is_active", True))
        product.slug = slugify(product.name) + "-" + str(uuid.uuid4())[:4]
        
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=422, detail=f"Ошибка типов данных: {str(e)}")

    # Очищаем старые варианты товара
    for old_variant in product.variants:
        await db.delete(old_variant)
    await db.flush()

    # Записываем новые измененные варианты
    variants_list = raw_data.get("variants", [])
    for v in variants_list:
        try:
            v_price = Decimal(str(v["price"])) if v.get("price") else product.base_price
            v_stock = int(v["stock"])
        except (ValueError, TypeError):
            v_price = product.base_price
            v_stock = 0

        v_sku = (
            v["sku"]
            if v.get("sku")
            else f"SKU-{product.id}-{str(uuid.uuid4())[:4].upper()}"
        )

        new_variant = ProductVariant(
            product_id=product.id,
            sku=v_sku,
            price=v_price,
            stock=v_stock,
            characteristics={
                "color": v.get("color", "Standard"),
                "size": v.get("size", "Standard"),
            },
        )
        db.add(new_variant)

    await db.commit()
    return {"status": "success", "message": "Товар и варианты успешно обновлены"}


@router.get("/details/{slug}", status_code=200)
async def get_product_details_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    # Принудительно ищем в нижнем регистре, чтобы исключить любые несовпадения
    query = select(Product).options(
        joinedload(Product.brand),
        joinedload(Product.category),
        selectinload(Product.images),
        selectinload(Product.variants),
        selectinload(Product.reviews).joinedload(Review.user)
    ).where(func.lower(Product.slug) == slug.lower())
    
    result = await db.execute(query)
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
        
    return product



# Схема валидации нового отзыва
class ReviewCreateInput(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5) # Оценка строго от 1 до 5
    text: str = Field(..., min_length=2)

# Проверить, имеет ли право пользователь оставить отзыв
@router.get("/check-review-eligibility/{product_id}", status_code=200)
async def check_review_eligibility(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ищем успешный доставленный заказ этого юзера, где лежал данный товар
    query = (
        select(Order)
        .join(OrderItem)
        .where(
            Order.user_id == current_user.id,
            Order.status == "delivered", # Товар должен быть доставлен!
            OrderItem.product_id == product_id
        )
    )
    result = await db.execute(query)
    order = result.scalars().first()
    
    # Также проверим, не оставлял ли он отзыв ранее (один товар - один отзыв)
    already_reviewed = select(Review).where(Review.product_id == product_id, Review.user_id == current_user.id)
    review_result = await db.execute(already_reviewed)
    
    return {
        "eligible": order is not None,
        "already_reviewed": review_result.scalars().first() is not None
    }

# Опубликовать новый отзыв
@router.post("/reviews/add", status_code=201)
async def add_product_review(
    payload: ReviewCreateInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверка безопасности на сервере
    check_query = select(Order).join(OrderItem).where(
        Order.user_id == current_user.id, Order.status == "delivered", OrderItem.product_id == payload.product_id
    )
    check_result = await db.execute(check_query)
    if not check_result.scalars().first():
        raise HTTPException(status_code=403, detail="Вы можете оставить отзыв только после получения товара!")

    new_review = Review(
        product_id=payload.product_id,
        user_id=current_user.id,
        rating=payload.rating,
        text=payload.text
    )
    db.add(new_review)
    await db.commit()
    return {"status": "success", "message": "Отзыв успешно опубликован!"}

