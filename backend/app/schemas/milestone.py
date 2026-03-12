import uuid
from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class MilestoneStatus(StrEnum):
    OPEN = "open"
    CLOSED = "closed"


class MilestoneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    due_date: date


class MilestoneUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    due_date: date | None = None
    status: MilestoneStatus | None = None


class MilestoneResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    description: str | None
    due_date: date
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
