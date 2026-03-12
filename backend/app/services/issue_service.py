import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.issue import IssueRepository
from app.repositories.project import ProjectRepository
from app.schemas.issue import IssueBulkUpdate, IssueCreate


class IssueService:
    def __init__(self, session: AsyncSession):
        self.issue_repo = IssueRepository(session)
        self.project_repo = ProjectRepository(session)
        self.session = session

    async def create_issue(self, project_id: uuid.UUID, data: IssueCreate):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        issue_number = await self.issue_repo.get_next_issue_number(project_id)
        issue_key = f"{project.key}-{issue_number}"

        return await self.issue_repo.create(
            project_id=project_id,
            issue_key=issue_key,
            **data.model_dump(),
        )

    async def bulk_update(self, project_id: uuid.UUID, updates: list[IssueBulkUpdate]):
        results = []
        for update in updates:
            issue = await self.issue_repo.get_by_id(update.id)
            if not issue or issue.project_id != project_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"Issue {update.id} not found in project",
                )
            update_data = update.model_dump(exclude={"id"}, exclude_unset=True)
            updated = await self.issue_repo.update(issue, **update_data)
            results.append(updated)
        return results
