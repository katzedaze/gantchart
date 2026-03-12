import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class DependencyType(StrEnum):
    FS = "FS"  # Finish-to-Start
    FF = "FF"  # Finish-to-Finish
    SS = "SS"  # Start-to-Start
    SF = "SF"  # Start-to-Finish


class DependencyCreate(BaseModel):
    predecessor_id: uuid.UUID
    dependency_type: DependencyType = DependencyType.FS


class DependencyResponse(BaseModel):
    id: uuid.UUID
    predecessor_id: uuid.UUID
    successor_id: uuid.UUID
    dependency_type: str
    created_at: datetime

    model_config = {"from_attributes": True}
