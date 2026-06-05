from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_owner
from app.schemas.restaurants import (
    PlatformStats,
    RestaurantItem,
    RestaurantList,
    RestaurantPatch,
)
from app.services.restaurant_service import RestaurantService

router = APIRouter()


@router.get("/restaurants", response_model=RestaurantList)
async def list_restaurants(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    plan: str = Query(""),
    status: str = Query(""),
    owner: str = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
) -> RestaurantList:
    return await RestaurantService(db).get_list(
        page=page, limit=limit, search=search, plan=plan, status=status
    )


@router.get("/stats", response_model=PlatformStats)
async def get_stats(
    owner: str = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
) -> PlatformStats:
    return await RestaurantService(db).get_stats()


@router.patch("/restaurants/{restaurant_id}", response_model=RestaurantItem)
async def update_restaurant(
    restaurant_id: UUID,
    patch: RestaurantPatch,
    owner: str = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
) -> RestaurantItem:
    return await RestaurantService(db).update_restaurant(restaurant_id, patch)


@router.delete("/restaurants/{restaurant_id}")
async def delete_restaurant(
    restaurant_id: UUID,
    owner: str = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await RestaurantService(db).delete_restaurant(restaurant_id)
    return {"message": "Ресторан удалён"}
