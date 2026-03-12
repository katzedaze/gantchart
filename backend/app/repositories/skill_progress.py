from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill_progress import SkillProgress


class SkillProgressRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self) -> list[SkillProgress]:
        result = await self.session.scalars(select(SkillProgress))
        return list(result.all())

    async def get_by_roadmap(self, roadmap_slug: str) -> list[SkillProgress]:
        result = await self.session.scalars(
            select(SkillProgress).where(
                SkillProgress.roadmap_slug == roadmap_slug,
            )
        )
        return list(result.all())

    async def bulk_upsert(
        self,
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
                    SkillProgress.roadmap_slug == roadmap_slug,
                    SkillProgress.node_id.in_(to_delete),
                )
            )

        # Upsert remaining items
        if to_upsert:
            values = [
                {
                    "roadmap_slug": roadmap_slug,
                    "node_id": item["node_id"],
                    "level": item["level"],
                }
                for item in to_upsert
            ]

            stmt = pg_insert(SkillProgress).values(values)
            stmt = stmt.on_conflict_do_update(
                constraint="uq_skill_progress_roadmap_node",
                set_={"level": stmt.excluded.level},
            )
            await self.session.execute(stmt)

        await self.session.flush()
        return await self.get_by_roadmap(roadmap_slug)

    async def delete_by_roadmap(self, roadmap_slug: str) -> None:
        await self.session.execute(
            delete(SkillProgress).where(
                SkillProgress.roadmap_slug == roadmap_slug,
            )
        )
        await self.session.flush()

    async def delete_all(self) -> None:
        await self.session.execute(delete(SkillProgress))
        await self.session.flush()
