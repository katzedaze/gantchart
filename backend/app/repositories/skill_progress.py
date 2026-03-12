import uuid

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill_progress import SkillProgress


class SkillProgressRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user(self, user_id: uuid.UUID) -> list[SkillProgress]:
        result = await self.session.scalars(select(SkillProgress).where(SkillProgress.user_id == user_id))
        return list(result.all())

    async def get_by_user_and_roadmap(self, user_id: uuid.UUID, roadmap_slug: str) -> list[SkillProgress]:
        result = await self.session.scalars(
            select(SkillProgress).where(
                SkillProgress.user_id == user_id,
                SkillProgress.roadmap_slug == roadmap_slug,
            )
        )
        return list(result.all())

    async def bulk_upsert(
        self,
        user_id: uuid.UUID,
        roadmap_slug: str,
        items: list[dict],
    ) -> list[SkillProgress]:
        if not items:
            return []

        # Separate items to delete (level=none) and upsert
        to_delete = [item["node_id"] for item in items if item["level"] == "none"]
        to_upsert = [item for item in items if item["level"] != "none"]

        # Delete items with level "none"
        if to_delete:
            await self.session.execute(
                delete(SkillProgress).where(
                    SkillProgress.user_id == user_id,
                    SkillProgress.roadmap_slug == roadmap_slug,
                    SkillProgress.node_id.in_(to_delete),
                )
            )

        # Upsert remaining items
        if to_upsert:
            values = [
                {
                    "user_id": user_id,
                    "roadmap_slug": roadmap_slug,
                    "node_id": item["node_id"],
                    "level": item["level"],
                }
                for item in to_upsert
            ]

            stmt = pg_insert(SkillProgress).values(values)
            stmt = stmt.on_conflict_do_update(
                constraint="uq_skill_progress",
                set_={"level": stmt.excluded.level},
            )
            await self.session.execute(stmt)

        await self.session.flush()
        return await self.get_by_user_and_roadmap(user_id, roadmap_slug)

    async def delete_by_user_and_roadmap(self, user_id: uuid.UUID, roadmap_slug: str) -> None:
        await self.session.execute(
            delete(SkillProgress).where(
                SkillProgress.user_id == user_id,
                SkillProgress.roadmap_slug == roadmap_slug,
            )
        )
        await self.session.flush()

    async def delete_all_by_user(self, user_id: uuid.UUID) -> None:
        await self.session.execute(delete(SkillProgress).where(SkillProgress.user_id == user_id))
        await self.session.flush()
