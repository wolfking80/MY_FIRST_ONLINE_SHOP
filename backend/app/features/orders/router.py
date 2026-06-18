import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.orders.models import Order, OrderItem
from app.core.database import get_db
from app.features.products import router
from app.features.users.dependencies import check_is_staff, get_current_user
from app.features.users.models import User
from app.features.carts.models import Cart, CartItem
from app.features.products.models import ProductVariant

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/orders-stats", status_code=200)
async def get_admin_orders_stats(
    db: AsyncSession = Depends(get_db), admin: User = Depends(check_is_staff)
):
    # Считаем выручку: сумма total_amount всех заказов, где статус оплаты paid (оплачено)
    revenue_query = select(func.sum(Order.total_amount)).where(
        Order.payment_status == "paid"
    )
    revenue_result = await db.execute(revenue_query)
    total_revenue = revenue_result.scalar() or 0.0

    # Считаем количество новых необработанных заказов (статус pending)
    pending_query = select(func.count(Order.id)).where(Order.status == "pending")
    pending_result = await db.execute(pending_query)
    pending_count = pending_result.scalar() or 0

    return {"total_revenue": float(total_revenue), "pending_orders": int(pending_count)}


class OrderCreateInput(BaseModel):
    phone: str
    delivery_address: str
    comment: str | None = None


@router.post("/checkout", status_code=201)
async def checkout_order(
    payload: OrderCreateInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Загружаем активную корзину текущего пользователя со всеми связями товаров
    cart_query = (
        select(Cart)
        .options(selectinload(Cart.items).joinedload(CartItem.product))
        .where(Cart.user_id == current_user.id, Cart.status == "active")
    )

    cart_result = await db.execute(cart_query)
    cart = cart_result.scalars().first()

    if not cart or not cart.items:
        raise HTTPException(
            status_code=400, detail="Ваша корзина пуста, оформление невозможно"
        )

    # Считаем общую сумму товаров и проверяем складские запасы
    items_sum = Decimal("0.00")
    items_to_process = []

    for item in cart.items:
        variant_query = select(ProductVariant).where(
            ProductVariant.id == item.variant_id
        )
        variant_result = await db.execute(variant_query)
        variant = variant_result.scalars().first()

        if not variant or variant.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Товар '{item.product.name}' закончился на складе или доступен в меньшем количестве!",
            )

        items_sum += Decimal(str(item.quantity)) * Decimal(str(item.product.base_price))
        items_to_process.append((item, variant))

    # Создаем основной заказ. Времена created_at и updated_at БД проставит сама через func.now()
    new_order = Order(
        user_id=current_user.id,
        status="pending",
        payment_status="pending",
        subtotal=items_sum,
        delivery_price=Decimal("0.00"),
        discount_amount=Decimal("0.00"),
        total_amount=items_sum,
        shipping_address=payload.delivery_address,
        contact_phone=payload.phone,
        recipient_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
        or current_user.username,
        customer_comment=payload.comment,
        status_history=[],  # Оставляем чистый пустой JSON-массив, чтобы не ломать валидацию сериализатора БД
        updated_at=func.now(),  # передаем нативную SQL-функцию текущего времени СУБД
    )
    db.add(new_order)
    await db.flush()  # Генерируем ID заказа для связывания с позициями

    # Переносим позиции и заполняем обязательные СНАПШОТЫ модели OrderItem
    for item, variant in items_to_process:
        # Физически списываем остаток со склада в PostgreSQL
        variant.stock -= item.quantity

        # Вызываем создание OrderItem. total_price посчитается сам внутри __init__ модели
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            product_name_snapshot=item.product.name,
            product_sku_snapshot=variant.sku or f"SKU-{item.product_id}",
            price_at_purchase=item.product.base_price,
            quantity=item.quantity,
        )
        db.add(order_item)

    # Переводим корзину в статус выполненной
    cart.status = "completed"
    cart.converted_to_order_id = new_order.id
    cart.updated_at = (
        func.now()
    )  # Также используем func.now() вместо ручных Python-объектов дат

    await db.commit()
    return {
        "status": "success",
        "message": "Заказ успешно оформлен!",
        "order_id": new_order.id,
    }


@router.get("/my-orders", status_code=200)
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Вытаскиваем все заказы ТЕКУЩЕГО пользователя и подгружаем состав товаров внутри них
    query = (
        select(Order)
        .options(selectinload(Order.items).joinedload(OrderItem.product))
        .where(Order.user_id == current_user.id)
        .order_by(Order.id.desc()) # Сначала выводим самые свежие заказы
    )
    result = await db.execute(query)
    orders = result.scalars().all()
    return orders
