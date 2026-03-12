import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.milestone import MilestoneRepository
from app.schemas.milestone import MilestoneCreate, MilestoneResponse, MilestoneUpdate

router = APIRouter()


@router.get(
    "/projects/{project_id}/milestones",
    response_model=list[MilestoneResponse],
)
async def list_milestones(project_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = MilestoneRepository(db)
    return await repo.get_by_project(project_id)


@router.post(
    "/projects/{project_id}/milestones",
    response_model=MilestoneResponse,
    status_code=201,
)
async def create_milestone(
    project_id: uuid.UUID,
    data: MilestoneCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = MilestoneRepository(db)
    return await repo.create(project_id=project_id, **data.model_dump())


@router.patch("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    milestone_id: uuid.UUID,
    data: MilestoneUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = MilestoneRepository(db)
    milestone = await repo.get_by_id(milestone_id)
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return await repo.update(milestone, **data.model_dump(exclude_unset=True))


@router.delete("/milestones/{milestone_id}", status_code=204)
async def delete_milestone(milestone_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = MilestoneRepository(db)
    milestone = await repo.get_by_id(milestone_id)
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    await repo.delete(milestone)
