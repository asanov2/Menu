from pydantic import BaseModel


class OrderItem(BaseModel):
    item_id: str
    name: str
    quantity: int
    price: int


class OrderCreate(BaseModel):
    order_type: str  # 'table' or 'preorder'
    table_number: int | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    items: list[OrderItem]
    total_price: int
    comment: str | None = None


class OrderResponse(BaseModel):
    order_id: str
    message: str


class OrderConfigResponse(BaseModel):
    orders_enabled: bool
    preorders_enabled: bool
    tables_count: int
    telegram_connected: bool = False
