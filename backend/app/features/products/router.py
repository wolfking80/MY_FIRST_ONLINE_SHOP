import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List

from app.core.database import get_db
from app.features.products.models import (
    Brand,
    Category,
    Product,
    ProductImage,
    ProductVariant,
)
from app.features.products.schemas import ProductShort
from app.features.products.utils import save_product_image
from app.features.users.dependencies import check_is_staff
from app.features.users.models import User

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
from pydantic import BaseModel


# Создаем мини-схему для валидации входящих вариантов прямо внутри JSON
class VariantInput(BaseModel):
    sku: str | None = None
    stock: int = 0
    price: float | None = None
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
    admin: User = Depends(check_is_staff),
):
    try:
        # Парсим JSON из строки
        raw_data = json.loads(product_data)

        name = raw_data["name"]
        base_price = float(raw_data["base_price"])
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

    # 1. Создаем базовый товар
    slug = name.lower().replace(" ", "-") + "-" + str(uuid.uuid4())[:4]
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

    # 2. Если админ не добавил ни одного варианта, создаем один дефолтный
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

    # 3. Циклом создаем все пришедшие варианты в базу данных
    for v in variants_list:
        # Если админ оставил цену варианта пустой, берем базовую цену товара
        v_price = float(v["price"]) if v.get("price") else base_price
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

    # 4. Сохраняем картинки
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
