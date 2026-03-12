import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.project import ProjectRepository
from app.schemas.bulk import BulkIds
from app.schemas.project import (
    MemberAdd,
    MemberResponse,
    MemberUserResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter()


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    db: Annotated[AsyncSession, Depends(get_db)],
    include_archived: bool = False,
):
    repo = ProjectRepository(db)
    return await repo.get_all_with_members(include_archived=include_archived)


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(data: ProjectCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = ProjectRepository(db)
    existing = await repo.get_by_key(data.key)
    if existing:
        raise HTTPException(status_code=409, detail="Project key already exists")
    project = await repo.create(**data.model_dump())
    return await repo.get_by_id_with_members(project.id)


@router.post("/bulk-delete", status_code=204)
async def bulk_delete_projects(
    data: BulkIds,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    await repo.bulk_delete(data.ids)


@router.post("/bulk-archive", status_code=200)
async def bulk_archive_projects(
    data: BulkIds,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    await repo.bulk_archive_projects(data.ids)
    return {"ok": True}


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = ProjectRepository(db)
    project = await repo.get_by_id_with_members(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await repo.update(project, **data.model_dump(exclude_unset=True))
    return await repo.get_by_id_with_members(project_id)


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await repo.delete(project)


@router.post("/{project_id}/archive", response_model=ProjectResponse)
async def archive_project(project_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await repo.archive_project(project_id)
    return await repo.get_by_id_with_members(project_id)


@router.post("/{project_id}/unarchive", response_model=ProjectResponse)
async def unarchive_project(project_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await repo.unarchive_project(project_id)
    return await repo.get_by_id_with_members(project_id)


@router.get("/{project_id}/members", response_model=list[MemberUserResponse])
async def list_members(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    project = await repo.get_by_id_with_members(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    result = []
    for member in project.members:
        result.append(
            MemberUserResponse(
                id=member.id,
                user_id=member.user_id,
                role=member.role,
                is_archived=member.is_archived,
                user_name=member.user.name if member.user else "Unknown",
                user_name_kana=member.user.name_kana if member.user else "",
                user_email=member.user.email if member.user else "",
                created_at=member.created_at,
            )
        )
    return result


@router.post("/{project_id}/members/bulk-delete", status_code=204)
async def bulk_delete_members(
    project_id: uuid.UUID,
    data: BulkIds,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    await repo.bulk_delete_members(project_id, data.ids)


@router.post("/{project_id}/members/bulk-archive", status_code=200)
async def bulk_archive_members(
    project_id: uuid.UUID,
    data: BulkIds,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    await repo.bulk_archive_members(project_id, data.ids)
    return {"ok": True}


@router.post("/{project_id}/members", response_model=MemberResponse, status_code=201)
async def add_member(
    project_id: uuid.UUID,
    data: MemberAdd,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await repo.add_member(project_id, data.user_id, data.role)


@router.delete("/{project_id}/members/{user_id}", status_code=204)
async def remove_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    removed = await repo.remove_member(project_id, user_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Member not found")


@router.post("/{project_id}/members/{user_id}/archive", status_code=200)
async def archive_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    result = await repo.archive_member(project_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"ok": True}


@router.post("/{project_id}/members/{user_id}/unarchive", status_code=200)
async def unarchive_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = ProjectRepository(db)
    result = await repo.unarchive_member(project_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"ok": True}
