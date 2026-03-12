from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.skill_progress import SkillProgressRepository
from app.schemas.skill_progress import (
    SkillProgressBulkUpsert,
    SkillProgressResponse,
)

router = APIRouter()


@router.get("/", response_model=list[SkillProgressResponse])
async def get_skill_progress(
    db: Annotated[AsyncSession, Depends(get_db)],
    roadmap_slug: str | None = Query(None),
):
    repo = SkillProgressRepository(db)
    if roadmap_slug:
        return await repo.get_by_roadmap(roadmap_slug)
    return await repo.get_all()


@router.put("/", response_model=list[SkillProgressResponse])
async def upsert_skill_progress(
    data: SkillProgressBulkUpsert,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = SkillProgressRepository(db)
    return await repo.bulk_upsert(
        data.roadmap_slug,
        [item.model_dump() for item in data.items],
    )


@router.delete("/", status_code=204)
async def delete_skill_progress(
    db: Annotated[AsyncSession, Depends(get_db)],
    roadmap_slug: str | None = Query(None),
):
    repo = SkillProgressRepository(db)
    if roadmap_slug:
        await repo.delete_by_roadmap(roadmap_slug)
    else:
        await repo.delete_all()
