from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.models.menu import Menu, WaiterCall
from app.schemas.menu import WaiterCallOut, WaiterCallsResponse, WaiterCallStatusUpdate

router = APIRouter()

VALID_STATUSES = {"new", "done"}


@router.get("", response_model=WaiterCallsResponse)
async def list_waiter_calls(
    before: datetime | None = Query(None),
    load_older: bool = Query(False),
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> WaiterCallsResponse:
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    upper = (before.replace(tzinfo=None) if before else now_utc)
    window_days = 30 if load_older else 7
    lower = upper - timedelta(days=window_days)

    calls_q = await db.execute(
        select(WaiterCall)
        .where(
            WaiterCall.restaurant_id == current.id,
            WaiterCall.created_at < upper,
            WaiterCall.created_at >= lower,
        )
        .order_by(WaiterCall.created_at.desc())
        .limit(201)
    )
    calls = calls_q.scalars().all()

    has_more = len(calls) == 201
    calls = calls[:200]

    menu_ids = {c.menu_id for c in calls}
    menus_by_id: dict[UUID, str] = {}
    if menu_ids:
        menus_q = await db.execute(
            select(Menu.id, Menu.name).where(Menu.id.in_(menu_ids))
        )
        for row in menus_q:
            menus_by_id[row.id] = row.name

    result = [
        WaiterCallOut(
            id=str(c.id),
            table_number=c.table_number,
            menu_id=str(c.menu_id),
            menu_name=menus_by_id.get(c.menu_id, "—"),
            status=c.status,
            created_at=c.created_at,
        )
        for c in calls
    ]

    return WaiterCallsResponse(calls=result, has_more=has_more)


@router.patch("/{call_id}/status", response_model=WaiterCallOut)
async def update_waiter_call_status(
    call_id: UUID,
    body: WaiterCallStatusUpdate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> WaiterCallOut:
    if body.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"status must be one of: {', '.join(VALID_STATUSES)}",
        )

    q = await db.execute(
        select(WaiterCall).where(
            WaiterCall.id == call_id,
            WaiterCall.restaurant_id == current.id,
        )
    )
    call = q.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waiter call not found")

    await db.execute(
        update(WaiterCall).where(WaiterCall.id == call_id).values(status=body.status)
    )
    await db.commit()
    await db.refresh(call)

    menu_name = "—"
    menus_q = await db.execute(select(Menu.name).where(Menu.id == call.menu_id))
    row = menus_q.scalar_one_or_none()
    if row:
        menu_name = row

    return WaiterCallOut(
        id=str(call.id),
        table_number=call.table_number,
        menu_id=str(call.menu_id),
        menu_name=menu_name,
        status=call.status,
        created_at=call.created_at,
    )
