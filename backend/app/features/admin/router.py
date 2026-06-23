from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified

from app.core.database import get_db
from app.features.users.dependencies import check_is_staff
from app.features.orders.models import Order, OrderItem

router = APIRouter(
    prefix="/admin/orders",
    tags=["Admin Orders"],
    dependencies=[Depends(check_is_staff)],
)


# Получить вообще ВСЕ заказы всех пользователей для панели админа
@router.get("/", status_code=200)
async def admin_get_all_orders(db: AsyncSession = Depends(get_db)):
    query = (
        select(Order)
        .options(selectinload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.id.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


# Изменить статус заказа (например, перевести в delivered)
@router.patch("/{order_id}/status", status_code=200)
async def admin_update_order_status(
    order_id: int,
    new_status: str,  # Принимаем строку: pending, shipped, delivered, cancelled
    db: AsyncSession = Depends(get_db),
):
    # Допустимые статусы согласно модели
    valid_statuses = [
        "pending",
        "confirmed",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
    ]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Неверный статус заказа")

    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalars().first()

    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    order.status = new_status

    # Если статус меняется на доставлен, автоматически закрываем и оплату для симуляции
    if new_status == "delivered":
        order.payment_status = "paid"
        order.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
    # Логируем изменение в status_history
    current_log = list(order.status_history) if order.status_history else []
    current_log.append({
        "status": new_status,
        "at": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
        "by": "admin"
    })
    
    # Принудительно маркируем поле JSON как измененное для SQLAlchemy
    order.status_history = current_log
    flag_modified(order, "status_history")    

    await db.commit()
    return {
        "status": "success",
        "message": f"Статус заказа №{order_id} изменен на {new_status}",
    }
