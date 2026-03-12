import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.issue import IssueRepository
from app.schemas.bulk import BulkIds
from app.schemas.issue import (
    IssueBulkUpdate,
    IssueCreate,
    IssueResponse,
    IssueUpdate,
)
from app.services.issue_service import IssueService

router = APIRouter()


@router.get("/projects/{project_id}/issues", response_model=list[IssueResponse])
async def list_issues(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = Query(None),
    priority: str | None = Query(None),
    assignee_id: uuid.UUID | None = Query(None),
    milestone_id: uuid.UUID | None = Query(None),
    include_archived: bool = Query(False),
):
    repo = IssueRepository(db)
    return await repo.get_by_project(
        project_id,
        status=status,
        priority=priority,
        assignee_id=assignee_id,
        milestone_id=milestone_id,
        include_archived=include_archived,
    )


@router.post(
    "/projects/{project_id}/issues",
    response_model=IssueResponse,
    status_code=201,
)
async def create_issue(
    project_id: uuid.UUID,
    data: IssueCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = IssueService(db)
    return await service.create_issue(project_id, data)


@router.patch(
    "/projects/{project_id}/issues/bulk",
    response_model=list[IssueResponse],
)
async def bulk_update_issues(
    project_id: uuid.UUID,
    updates: list[IssueBulkUpdate],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = IssueService(db)
    return await service.bulk_update(project_id, updates)


@router.post(
    "/projects/{project_id}/issues/bulk-delete",
    status_code=204,
)
async def bulk_delete_issues(
    project_id: uuid.UUID,
    data: BulkIds,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = IssueRepository(db)
    await repo.bulk_delete_by_project(project_id, data.ids)


@router.post(
    "/projects/{project_id}/issues/bulk-archive",
    status_code=200,
)
async def bulk_archive_issues(
    project_id: uuid.UUID,
    data: BulkIds,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = IssueRepository(db)
    await repo.bulk_archive_by_project(project_id, data.ids)
    return {"ok": True}


@router.post("/issues/{issue_id}/archive", response_model=IssueResponse)
async def archive_issue(issue_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = IssueRepository(db)
    issue = await repo.archive_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.post("/issues/{issue_id}/unarchive", response_model=IssueResponse)
async def unarchive_issue(issue_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = IssueRepository(db)
    issue = await repo.unarchive_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.get("/issues/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = IssueRepository(db)
    issue = await repo.get_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.patch("/issues/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: uuid.UUID,
    data: IssueUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = IssueRepository(db)
    issue = await repo.get_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return await repo.update(issue, **data.model_dump(exclude_unset=True))


@router.delete("/issues/{issue_id}", status_code=204)
async def delete_issue(issue_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = IssueRepository(db)
    issue = await repo.get_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    await repo.delete(issue)
