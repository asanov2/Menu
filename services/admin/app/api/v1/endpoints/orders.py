from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.models.menu import Menu
from app.models.order import Order

router = APIRouter()

VALID_STATUSES = {"new", "done"}


class OrderItemSchema(BaseModel):
    item_id: str
    name: str
    quantity: int
    price: int


class OrderOut(BaseModel):
    id: str
    order_type: str
    table_number: int | None
    customer_name: str | None
    customer_phone: str | None
    items: list[OrderItemSchema]
    total_price: int
    comment: str | None
    menu_id: str
    menu_name: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OrdersResponse(BaseModel):
    orders: list[OrderOut]
    has_more: bool


class StatusUpdate(BaseModel):
    status: str


@router.get("", response_model=OrdersResponse)
async def list_orders(
    before: datetime | None = Query(None, description="Cursor: return orders created before this datetime"),
    load_older: bool = Query(False, description="If true, load 30 days before `before`; default loads 7 days"),
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> OrdersResponse:
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    upper = (before.replace(tzinfo=None) if before else now_utc)
    window_days = 30 if load_older else 7
    lower = upper - timedelta(days=window_days)

    # Fetch orders in window
    orders_q = await db.execute(
        select(Order)
        .where(
            Order.restaurant_id == current.id,
            Order.created_at < upper,
            Order.created_at >= lower,
        )
        .order_by(Order.created_at.desc())
        .limit(201)
    )
    orders = orders_q.scalars().all()

    has_more = len(orders) == 201
    orders = orders[:200]

    # Collect unique menu_ids and fetch names in one query
    menu_ids = {o.menu_id for o in orders}
    menus_by_id: dict[UUID, str] = {}
    if menu_ids:
        menus_q = await db.execute(
            select(Menu.id, Menu.name).where(Menu.id.in_(menu_ids))
        )
        for row in menus_q:
            menus_by_id[row.id] = row.name

    result = []
    for o in orders:
        result.append(OrderOut(
            id=str(o.id),
            order_type=o.order_type,
            table_number=o.table_number,
            customer_name=o.customer_name,
            customer_phone=o.customer_phone,
            items=[OrderItemSchema(**item) for item in o.items],
            total_price=o.total_price,
            comment=o.comment,
            menu_id=str(o.menu_id),
            menu_name=menus_by_id.get(o.menu_id, "—"),
            status=o.status,
            created_at=o.created_at,
        ))

    return OrdersResponse(orders=result, has_more=has_more)


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: UUID,
    body: StatusUpdate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    if body.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"status must be one of: {', '.join(VALID_STATUSES)}",
        )

    # Verify order belongs to this restaurant
    q = await db.execute(
        select(Order).where(Order.id == order_id, Order.restaurant_id == current.id)
    )
    order = q.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    await db.execute(
        update(Order)
        .where(Order.id == order_id)
        .values(status=body.status)
    )
    await db.commit()
    await db.refresh(order)

    menu_name = "—"
    menus_q = await db.execute(select(Menu.name).where(Menu.id == order.menu_id))
    row = menus_q.scalar_one_or_none()
    if row:
        menu_name = row

    return OrderOut(
        id=str(order.id),
        order_type=order.order_type,
        table_number=order.table_number,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        items=[OrderItemSchema(**item) for item in order.items],
        total_price=order.total_price,
        comment=order.comment,
        menu_id=str(order.menu_id),
        menu_name=menu_name,
        status=order.status,
        created_at=order.created_at,
    )
