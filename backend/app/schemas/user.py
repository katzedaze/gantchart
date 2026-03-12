import re
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

KATAKANA_PATTERN = re.compile(r"^[\u30A0-\u30FF\u3000\s]*$")


class UserCreate(BaseModel):
    name: str
    name_kana: str = ""
    email: EmailStr
    avatar_url: str | None = None

    @field_validator("name_kana")
    @classmethod
    def validate_name_kana(cls, v: str) -> str:
        if v and not KATAKANA_PATTERN.match(v):
            raise ValueError("カタカナで入力してください")
        return v


class UserUpdate(BaseModel):
    name: str | None = None
    name_kana: str | None = None
    email: EmailStr | None = None
    avatar_url: str | None = None
    is_archived: bool | None = None

    @field_validator("name_kana")
    @classmethod
    def validate_name_kana(cls, v: str | None) -> str | None:
        if v is not None and v and not KATAKANA_PATTERN.match(v):
            raise ValueError("カタカナで入力してください")
        return v


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    name_kana: str
    email: str
    avatar_url: str | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
