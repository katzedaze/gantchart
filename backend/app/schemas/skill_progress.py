import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SkillProgressItem(BaseModel):
    node_id: str
    level: str = Field(pattern=r"^(none|learning|done)$")


class SkillProgressBulkUpsert(BaseModel):
    roadmap_slug: str = Field(max_length=100)
    items: list[SkillProgressItem]


class SkillProgressResponse(BaseModel):
    id: uuid.UUID
    roadmap_slug: str
    node_id: str
    level: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoadmapProgressSummary(BaseModel):
    roadmap_slug: str
    total: int
    done: int
    learning: int
