from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.core.database import get_db
from app.features.carts.models import Cart, CartItem
from app.features.products.models import Product
from app.features.users.dependencies import get_current_user
from app.features.users.models import User
from pydantic import BaseModel

router = APIRouter(prefix="/cart", tags=["Cart"])


# Схема для валидации входных данных
class CartAddInput(BaseModel):
    product_id: int
    variant_id: int | None = None  # Если фронтенд не передал вариант, выберем дефолтный


@router.post("/add", status_code=201)
async def add_to_cart(
    payload: CartAddInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Проверяем, существует ли сам товар
    product_query = (
        select(Product)
        .options(joinedload(Product.variants))
        .where(Product.id == payload.product_id)
    )
    product_result = await db.execute(product_query)
    product = product_result.scalars().first()

    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    # Определяем variant_id. Если не передан, берем первый попавшийся вариант товара
    v_id = payload.variant_id
    if not v_id:
        if not product.variants:
            raise HTTPException(
                status_code=400, detail="У товара нет доступных вариантов (размеров)"
            )
        v_id = product.variants[0].id  # Берем первый дефолтный вариант

    # Ищем активную корзину пользователя. Если нет — создаем новую.
    cart_query = select(Cart).where(
        Cart.user_id == current_user.id, Cart.status == "active"
    )
    cart_result = await db.execute(cart_query)
    cart = cart_result.scalars().first()

    if not cart:
        current_time = datetime.utcnow()

        cart = Cart(
            user_id=current_user.id,
            status="active",
            created_at=current_time,
            updated_at=current_time,
        )
        db.add(cart)
        await db.flush()  # Получаем id новой корзины

    # Проверяем дубликаты товара в корзине
    item_query = select(CartItem).where(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product.id,
        CartItem.variant_id == v_id,
    )
    item_result = await db.execute(item_query)
    cart_item = item_result.scalars().first()

    # ЗАЩИТА ОСТАТКОВ: Ищем реальный stock этого варианта на складе
    from app.features.products.models import ProductVariant

    variant_query = select(ProductVariant).where(ProductVariant.id == v_id)
    variant_result = await db.execute(variant_query)
    db_variant = variant_result.scalars().first()

    if cart_item:
        # Если товар уже в корзине, проверяем: не превысит ли +1 лимит склада
        if db_variant and cart_item.quantity >= db_variant.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Извините, вы не можете добавить больше товаров. На складе всего {db_variant.stock} шт.!",
            )
        cart_item.quantity += 1
    else:
        # Если товара еще нет в корзине, проверяем: есть ли вообще хоть 1 шт. на складе
        if db_variant and db_variant.stock <= 0:
            raise HTTPException(
                status_code=400,
                detail="Извините, данного товара сейчас нет в наличии на складе!",
            )
        cart_item = CartItem(
            cart_id=cart.id,
            user_id=current_user.id,
            product_id=product.id,
            variant_id=v_id,
            quantity=1,
        )
        db.add(cart_item)
    await db.commit()
    return {
        "status": "success",
        "message": "Товар добавлен в корзину",
        "quantity": cart_item.quantity,
    }


@router.get("/", status_code=200)
async def get_user_cart(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Находим активную корзину текущего юзера и сразу подгружаем все товары и их картинки
    query = (
        select(Cart)
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.product)
            .selectinload(Product.images),
            selectinload(Cart.items)
            .selectinload(CartItem.product)
            .selectinload(Product.variants),
        )
        .where(Cart.user_id == current_user.id, Cart.status == "active")
    )

    result = await db.execute(query)
    cart = result.scalars().first()

    if not cart:
        return {"items": [], "total_price": 0.0}

    # Считаем общую стоимость корзины
    total_price = sum(
        float(item.quantity) * float(item.product.base_price) for item in cart.items
    )

    return {"id": cart.id, "items": cart.items, "total_price": total_price}


# Изменение количества товара (Увеличить / Уменьшить)
from app.features.products.models import (
    ProductVariant,
)  # Убедитесь, что импорт есть вверху


@router.patch("/items/{item_id}", status_code=200)
async def update_cart_item_quantity(
    item_id: int,
    quantity: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Ищем элемент корзины
    query = select(CartItem).where(
        CartItem.id == item_id, CartItem.user_id == current_user.id
    )
    result = await db.execute(query)
    item = result.scalars().first()

    if not item:
        raise HTTPException(status_code=404, detail="Товар в корзине не найден")

    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Количество должно быть больше 0")

    # ПРОВЕРКА СКЛАДА: Ищем конкретный вариант товара, чтобы узнать его реальный stock
    variant_query = select(ProductVariant).where(ProductVariant.id == item.variant_id)
    variant_result = await db.execute(variant_query)
    variant = variant_result.scalars().first()

    if not variant:
        raise HTTPException(
            status_code=404, detail="Вариант товара не найден на складе"
        )

    # Если покупатель просит больше, чем есть физически — блокируем!
    if quantity > variant.stock:
        raise HTTPException(
            status_code=400,
            detail=f"Извините, на складе осталось всего {variant.stock} шт. данного товара!",
        )

    item.quantity = quantity
    await db.commit()
    return {"status": "success", "quantity": item.quantity}


# Полное удаление товара из корзины
@router.delete("/items/{item_id}", status_code=200)
async def delete_cart_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(CartItem).where(
        CartItem.id == item_id, CartItem.user_id == current_user.id
    )
    result = await db.execute(query)
    item = result.scalars().first()

    if not item:
        raise HTTPException(status_code=404, detail="Товар в корзине не найден")

    await db.delete(item)
    await db.commit()
    return {"status": "success", "message": "Товар успешно удален из корзины"}
