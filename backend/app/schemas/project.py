import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class MemberRole(StrEnum):
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    key: str = Field(..., min_length=2, max_length=10, pattern=r"^[A-Z]+$")
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_archived: bool | None = None


class MemberAdd(BaseModel):
    user_id: uuid.UUID
    role: MemberRole = MemberRole.MEMBER


class MemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    is_archived: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberUserResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    is_archived: bool
    user_name: str
    user_name_kana: str
    user_email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    key: str
    description: str | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    members: list[MemberResponse] = []

    model_config = {"from_attributes": True}
