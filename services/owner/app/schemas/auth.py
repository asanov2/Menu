from pydantic import BaseModel, EmailStr


class OwnerLoginRequest(BaseModel):
    email: EmailStr
    password: str


class OwnerLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
