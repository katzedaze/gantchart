import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1)
    author_id: uuid.UUID


class CommentUpdate(BaseModel):
    body: str = Field(..., min_length=1)


class CommentAuthor(BaseModel):
    id: uuid.UUID
    name: str
    name_kana: str
    avatar_url: str | None

    model_config = {"from_attributes": True}


class CommentResponse(BaseModel):
    id: uuid.UUID
    issue_id: uuid.UUID
    author_id: uuid.UUID
    body: str
    created_at: datetime
    updated_at: datetime
    author: CommentAuthor | None = None

    model_config = {"from_attributes": True}


class AttachmentResponse(BaseModel):
    id: uuid.UUID
    comment_id: uuid.UUID | None
    issue_id: uuid.UUID
    filename: str
    filepath: str
    content_type: str
    size: int
    created_at: datetime

    model_config = {"from_attributes": True}
