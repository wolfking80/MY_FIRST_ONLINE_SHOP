import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List

from app.core.database import get_db
from app.features.products.models import Brand, Category, Product, ProductImage
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
    db: AsyncSession = Depends(get_db)
):
    # Грузим товар + бренд + все картинки
    query = select(Product).options(
        joinedload(Product.brand),
        joinedload(Product.images)
    ).where(Product.is_active == True)

    if category_id:
        query = query.where(Product.category_id == category_id)
    if brand_id:
        query = query.where(Product.brand_id == brand_id)

    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    # unique() обязателен, когда используем joinedload с коллекциями (картинками)
    products = result.unique().scalars().all()
    
    return products


@router.post("/add", status_code=201)
async def admin_add_product(
    name: str = Form(...),
    base_price: float = Form(...),
    category_id: int = Form(...),
    brand_id: int = Form(...),
    description: str = Form(None),
    files: list[UploadFile] = File(..., description="Выложите одну или несколько картинок"), # Принимаем сразу несколько фото
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_is_staff)
):
    # Генерируем slug и создаем товар
    slug = name.lower().replace(" ", "-") + "-" + str(uuid.uuid4())[:4]
    new_product = Product(
        name=name, base_price=base_price, category_id=category_id, 
        brand_id=brand_id, description=description, slug=slug
    )
    db.add(new_product)
    await db.flush() # Получаем id товара

    # Сохраняем все картинки
    for idx, file in enumerate(files):
        img_url = save_product_image(file)
        new_img = ProductImage(
            product_id=new_product.id,
            url=img_url,
            is_main=(idx == 0) # Первая картинка будет главной
        )
        db.add(new_img)

    await db.commit()
    return {"status": "success", "id": new_product.id}


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