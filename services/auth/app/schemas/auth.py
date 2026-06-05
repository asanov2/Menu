import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    city: str | None = Field(default=None, max_length=100)
    type: str | None = Field(default=None, max_length=50)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9][a-z0-9-]*[a-z0-9]$", v):
            raise ValueError(
                "Slug must contain only lowercase letters, numbers, and hyphens"
            )
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RestaurantResponse(BaseModel):
    id: UUID
    email: str
    name: str
    slug: str
    plan: str
    status: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VerifyTokenResponse(BaseModel):
    valid: bool
    restaurant_id: UUID | None = None
    plan: str | None = None
    slug: str | None = None


class UpdateProfileRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8, max_length=100)


class RegisterVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class RegisterRequestResponse(BaseModel):
    detail: str


class RegisterVerifyResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id: UUID
    email: str
    name: str
    slug: str
    plan: str
    is_active: bool
