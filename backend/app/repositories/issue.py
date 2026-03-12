import uuid

from sqlalchemy import delete as sa_delete
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue import Issue
from app.repositories.base import BaseRepository


class IssueRepository(BaseRepository[Issue]):
    def __init__(self, session: AsyncSession):
        super().__init__(Issue, session)

    async def get_by_project(
        self,
        project_id: uuid.UUID,
        status: str | None = None,
        priority: str | None = None,
        assignee_id: uuid.UUID | None = None,
        milestone_id: uuid.UUID | None = None,
        include_archived: bool = False,
    ) -> list[Issue]:
        stmt = select(Issue).where(Issue.project_id == project_id)
        if not include_archived:
            stmt = stmt.where(Issue.is_archived == False)  # noqa: E712
        if status:
            stmt = stmt.where(Issue.status == status)
        if priority:
            stmt = stmt.where(Issue.priority == priority)
        if assignee_id:
            stmt = stmt.where(Issue.assignee_id == assignee_id)
        if milestone_id:
            stmt = stmt.where(Issue.milestone_id == milestone_id)
        stmt = stmt.order_by(Issue.sort_order, Issue.created_at)
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_next_issue_number(self, project_id: uuid.UUID) -> int:
        result = await self.session.scalar(
            select(func.coalesce(func.max(Issue.sort_order), 0)).where(Issue.project_id == project_id)
        )
        count = await self.session.scalar(select(func.count(Issue.id)).where(Issue.project_id == project_id))
        return max(result or 0, count or 0) + 1

    async def get_by_project_for_gantt(self, project_id: uuid.UUID) -> list[Issue]:
        result = await self.session.scalars(
            select(Issue)
            .where(Issue.project_id == project_id)
            .where(Issue.is_archived == False)  # noqa: E712
            .order_by(Issue.start_date.nulls_last(), Issue.sort_order)
        )
        return list(result.all())

    async def archive_issue(self, issue_id: uuid.UUID) -> Issue | None:
        issue = await self.get_by_id(issue_id)
        if not issue:
            return None
        return await self.update(issue, is_archived=True)

    async def unarchive_issue(self, issue_id: uuid.UUID) -> Issue | None:
        issue = await self.get_by_id(issue_id)
        if not issue:
            return None
        return await self.update(issue, is_archived=False)

    async def bulk_delete_by_project(self, project_id: uuid.UUID, issue_ids: list[uuid.UUID]) -> None:
        """Bulk delete issues belonging to a project."""
        await self.session.execute(
            sa_delete(Issue).where(
                Issue.id.in_(issue_ids),
                Issue.project_id == project_id,
            )
        )
        await self.session.flush()

    async def get_descendants(self, issue_id: uuid.UUID) -> set[uuid.UUID]:
        """Get all descendant issue IDs (children, grandchildren, etc.)."""
        descendants: set[uuid.UUID] = set()
        queue = [issue_id]
        while queue:
            current_id = queue.pop()
            children = await self.session.scalars(select(Issue.id).where(Issue.parent_id == current_id))
            for child_id in children.all():
                if child_id not in descendants:
                    descendants.add(child_id)
                    queue.append(child_id)
        return descendants

    async def get_ancestors(self, issue_id: uuid.UUID) -> set[uuid.UUID]:
        """Get all ancestor issue IDs (parent, grandparent, etc.)."""
        ancestors: set[uuid.UUID] = set()
        current_id = issue_id
        while current_id:
            issue = await self.get_by_id(current_id)
            if not issue or not issue.parent_id:
                break
            if issue.parent_id in ancestors:
                break  # safety: already seen
            ancestors.add(issue.parent_id)
            current_id = issue.parent_id
        return ancestors

    async def bulk_archive_by_project(self, project_id: uuid.UUID, issue_ids: list[uuid.UUID]) -> None:
        """Bulk archive issues belonging to a project."""
        await self.session.execute(
            update(Issue)
            .where(
                Issue.id.in_(issue_ids),
                Issue.project_id == project_id,
            )
            .values(is_archived=True)
        )
        await self.session.flush()
