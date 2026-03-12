import uuid

from sqlalchemy import delete as sa_delete
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_all(self, include_archived: bool = False) -> list[User]:
        stmt = select(User)
        if not include_archived:
            stmt = stmt.where(User.is_archived == False)  # noqa: E712
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.scalars(select(User).where(User.email == email))
        return result.first()

    async def archive_user(self, user_id: uuid.UUID) -> User | None:
        user = await self.get_by_id(user_id)
        if not user:
            return None
        return await self.update(user, is_archived=True)

    async def unarchive_user(self, user_id: uuid.UUID) -> User | None:
        user = await self.get_by_id(user_id)
        if not user:
            return None
        return await self.update(user, is_archived=False)

    async def bulk_delete(self, user_ids: list[uuid.UUID]) -> None:
        await self.session.execute(sa_delete(User).where(User.id.in_(user_ids)))
        await self.session.flush()

    async def bulk_archive(self, user_ids: list[uuid.UUID]) -> None:
        await self.session.execute(update(User).where(User.id.in_(user_ids)).values(is_archived=True))
        await self.session.flush()
