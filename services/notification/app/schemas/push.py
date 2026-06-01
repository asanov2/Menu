from pydantic import BaseModel


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class SubscribeRequest(BaseModel):
    endpoint: str
    keys: PushKeys
    device_label: str | None = None


class UnsubscribeRequest(BaseModel):
    endpoint: str


class SendPushRequest(BaseModel):
    subject_type: str
    subject_id: str
    title: str
    body: str
    data: dict | None = None


class VapidPublicKeyResponse(BaseModel):
    public_key: str
