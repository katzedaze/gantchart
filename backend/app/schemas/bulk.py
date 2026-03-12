import uuid

from pydantic import BaseModel, field_validator

MAX_BULK_SIZE = 100


class BulkIds(BaseModel):
    ids: list[uuid.UUID]

    @field_validator("ids")
    @classmethod
    def limit_size(cls, v: list[uuid.UUID]) -> list[uuid.UUID]:
        if len(v) > MAX_BULK_SIZE:
            raise ValueError(f"一度に操作できるのは最大{MAX_BULK_SIZE}件です")
        if len(v) == 0:
            raise ValueError("IDを1件以上指定してください")
        return v
