import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dependency import IssueDependency
from app.repositories.base import BaseRepository


class DependencyRepository(BaseRepository[IssueDependency]):
    def __init__(self, session: AsyncSession):
        super().__init__(IssueDependency, session)

    async def get_by_issue(self, issue_id: uuid.UUID) -> list[IssueDependency]:
        result = await self.session.scalars(
            select(IssueDependency).where(
                or_(
                    IssueDependency.predecessor_id == issue_id,
                    IssueDependency.successor_id == issue_id,
                )
            )
        )
        return list(result.all())

    async def get_by_project_issues(self, issue_ids: list[uuid.UUID]) -> list[IssueDependency]:
        if not issue_ids:
            return []
        result = await self.session.scalars(
            select(IssueDependency).where(IssueDependency.predecessor_id.in_(issue_ids))
        )
        return list(result.all())

    async def get_all_successors(self) -> list[IssueDependency]:
        result = await self.session.scalars(select(IssueDependency))
        return list(result.all())
