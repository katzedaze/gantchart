import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.skill_progress import SkillProgressRepository
from app.repositories.user import UserRepository
from app.schemas.skill_progress import (
    SkillProgressBulkUpsert,
    SkillProgressResponse,
)

router = APIRouter()


@router.get("/{user_id}/skill-progress", response_model=list[SkillProgressResponse])
async def get_skill_progress(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    roadmap_slug: str | None = Query(None),
):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    repo = SkillProgressRepository(db)
    if roadmap_slug:
        return await repo.get_by_user_and_roadmap(user_id, roadmap_slug)
    return await repo.get_by_user(user_id)


@router.put("/{user_id}/skill-progress", response_model=list[SkillProgressResponse])
async def upsert_skill_progress(
    user_id: uuid.UUID,
    data: SkillProgressBulkUpsert,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    repo = SkillProgressRepository(db)
    return await repo.bulk_upsert(
        user_id,
        data.roadmap_slug,
        [item.model_dump() for item in data.items],
    )


@router.delete("/{user_id}/skill-progress", status_code=204)
async def delete_skill_progress(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    roadmap_slug: str | None = Query(None),
):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    repo = SkillProgressRepository(db)
    if roadmap_slug:
        await repo.delete_by_user_and_roadmap(user_id, roadmap_slug)
    else:
        await repo.delete_all_by_user(user_id)
