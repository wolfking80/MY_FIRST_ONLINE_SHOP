from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.orders.models import Order
from app.core.database import get_db
from app.features.products import router
from app.features.users.dependencies import check_is_staff
from app.features.users.models import User


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
