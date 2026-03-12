import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.milestone import Milestone
from app.repositories.base import BaseRepository


class MilestoneRepository(BaseRepository[Milestone]):
    def __init__(self, session: AsyncSession):
        super().__init__(Milestone, session)

    async def get_by_project(self, project_id: uuid.UUID) -> list[Milestone]:
        result = await self.session.scalars(
            select(Milestone).where(Milestone.project_id == project_id).order_by(Milestone.due_date)
        )
        return list(result.all())
