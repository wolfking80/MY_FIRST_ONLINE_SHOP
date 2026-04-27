from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List

from app.core.database import get_db
from app.features.products.models import Product
from app.features.products.schemas import ProductShort

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

