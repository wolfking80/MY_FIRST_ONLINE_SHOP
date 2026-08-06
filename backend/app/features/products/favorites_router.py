from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_db
from app.features.users.dependencies import get_current_user
from app.features.users.models import User
from app.features.products.models import Product, Favorite
from app.features.products.schemas import ProductShort
from typing import List

router = APIRouter(prefix="/favorites", tags=["Favorites"])


# Добавить / Удалить из избранного
@router.post("/toggle/{product_id}", status_code=200)
async def toggle_favorite(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверяем, существует ли вообще такой товар
    prod_stmt = select(Product).where(Product.id == product_id)
    prod_res = await db.execute(prod_stmt)
    if not prod_res.scalars().first():
        raise HTTPException(status_code=404, detail="Товар не найден")

    # Ищем, отложил ли уже юзер этот товар
    fav_stmt = select(Favorite).where(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id
    )
    fav_res = await db.execute(fav_stmt)
    favorite = fav_res.scalars().first()

    if favorite:
        # Если уже есть в избранном — удаляем
        await db.execute(delete(Favorite).where(Favorite.user_id == current_user.id, Favorite.product_id == product_id))
        await db.commit()
        return {"status": "success", "is_favorite": False, "message": "Товар удален из избранного"}
    else:
        # Если товара нет в избранном — добавляем
        new_fav = Favorite(user_id=current_user.id, product_id=product_id)
        db.add(new_fav)
        await db.commit()
        return {"status": "success", "is_favorite": True, "message": "Товар добавлен в избранное ❤️"}
      

# Получить список всех избранных товаров текущего пользователя
@router.get("/", response_model=List[ProductShort])
async def get_my_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Запрос с JOIN таблицы избранного и подгрузкой картинок/брендов
    from sqlalchemy.orm import joinedload, selectinload
    
    query = (
        select(Product)
        .join(Favorite, Favorite.product_id == Product.id)
        .options(
            joinedload(Product.brand),
            selectinload(Product.images),
            selectinload(Product.variants)
        )
        .where(Favorite.user_id == current_user.id, Product.is_active == True)
    )

    result = await db.execute(query)
    products = result.unique().scalars().all()
    
    # Подмешиваем средний рейтинг и количество отзывов, как на главной витрине
    from sqlalchemy import func
    from app.features.products.models import Review
    for prod in products:
        rating_stmt = select(func.avg(Review.rating)).where(Review.product_id == prod.id)
        rating_res = await db.execute(rating_stmt)
        avg_score = rating_res.scalar()
        prod.average_rating = float(avg_score) if avg_score is not None else 0.0

        count_stmt = select(func.count(Review.id)).where(Review.product_id == prod.id)
        count_res = await db.execute(count_stmt)
        prod.reviews_count = count_res.scalar() or 0
        
        prod.total_stock = sum(int(v.stock) for v in prod.variants) if prod.variants else 0

    return products
