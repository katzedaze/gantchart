import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field, model_validator


class IssueType(StrEnum):
    TASK = "task"
    BUG = "bug"
    STORY = "story"


class IssueStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class IssuePriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IssueCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    issue_type: IssueType
    status: IssueStatus = IssueStatus.OPEN
    priority: IssuePriority = IssuePriority.MEDIUM
    parent_id: uuid.UUID | None = None
    assignee_id: uuid.UUID | None = None
    milestone_id: uuid.UUID | None = None
    start_date: date | None = None
    due_date: date | None = None
    estimated_hours: Decimal | None = Field(None, gt=0)
    progress: int = Field(0, ge=0, le=100)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.due_date and self.start_date > self.due_date:
            raise ValueError("due_date must be after start_date")
        return self


class IssueUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    issue_type: IssueType | None = None
    status: IssueStatus | None = None
    priority: IssuePriority | None = None
    parent_id: uuid.UUID | None = None
    assignee_id: uuid.UUID | None = None
    milestone_id: uuid.UUID | None = None
    start_date: date | None = None
    due_date: date | None = None
    estimated_hours: Decimal | None = Field(None, gt=0)
    actual_hours: Decimal | None = Field(None, gt=0)
    progress: int | None = Field(None, ge=0, le=100)
    sort_order: int | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.due_date and self.start_date > self.due_date:
            raise ValueError("due_date must be after start_date")
        return self


class IssueBulkUpdate(BaseModel):
    id: uuid.UUID
    start_date: date | None = None
    due_date: date | None = None
    sort_order: int | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.due_date and self.start_date > self.due_date:
            raise ValueError("due_date must be after start_date")
        return self


class IssueResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    parent_id: uuid.UUID | None
    milestone_id: uuid.UUID | None
    assignee_id: uuid.UUID | None
    issue_key: str
    title: str
    description: str | None
    issue_type: str
    status: str
    priority: str
    start_date: date | None
    due_date: date | None
    estimated_hours: Decimal | None
    actual_hours: Decimal | None
    progress: int
    sort_order: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
