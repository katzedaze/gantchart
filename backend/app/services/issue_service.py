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

        if data.parent_id:
            await self._validate_parent(data.parent_id, target_issue_id=None)

        issue_number = await self.issue_repo.get_next_issue_number(project_id)
        issue_key = f"{project.key}-{issue_number}"

        return await self.issue_repo.create(
            project_id=project_id,
            issue_key=issue_key,
            **data.model_dump(),
        )

    async def validate_parent_assignment(self, issue_id: uuid.UUID, parent_id: uuid.UUID | None) -> None:
        """Validate parent_id assignment for an existing issue."""
        if not parent_id:
            return
        await self._validate_parent(parent_id, target_issue_id=issue_id)

    async def _validate_parent(self, parent_id: uuid.UUID, target_issue_id: uuid.UUID | None) -> None:
        parent = await self.issue_repo.get_by_id(parent_id)
        if not parent:
            raise HTTPException(status_code=400, detail="親課題が見つかりません")

        if target_issue_id:
            if parent_id == target_issue_id:
                raise HTTPException(status_code=400, detail="自分自身を親課題に設定できません")
            descendants = await self.issue_repo.get_descendants(target_issue_id)
            if parent_id in descendants:
                raise HTTPException(
                    status_code=400,
                    detail="子孫課題を親課題に設定できません（循環参照）",
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
