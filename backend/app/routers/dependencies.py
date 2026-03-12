import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.dependency import DependencyRepository
from app.schemas.dependency import DependencyCreate, DependencyResponse
from app.services.dependency_service import DependencyService

router = APIRouter()


@router.post(
    "/issues/{issue_id}/dependencies",
    response_model=DependencyResponse,
    status_code=201,
)
async def add_dependency(
    issue_id: uuid.UUID,
    data: DependencyCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = DependencyService(db)
    return await service.create_dependency(
        successor_id=issue_id,
        predecessor_id=data.predecessor_id,
        dependency_type=data.dependency_type,
    )


@router.get(
    "/issues/{issue_id}/dependencies",
    response_model=list[DependencyResponse],
)
async def get_dependencies(issue_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = DependencyRepository(db)
    return await repo.get_by_issue(issue_id)


@router.delete("/dependencies/{dependency_id}", status_code=204)
async def delete_dependency(dependency_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = DependencyRepository(db)
    dep = await repo.get_by_id(dependency_id)
    if not dep:
        raise HTTPException(status_code=404, detail="Dependency not found")
    await repo.delete(dep)
