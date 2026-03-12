import uuid

from sqlalchemy import delete as sa_delete
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.issue import Issue
from app.models.project import Project, ProjectMember
from app.models.user import User  # noqa: F401
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session: AsyncSession):
        super().__init__(Project, session)

    async def get_by_id_with_members(self, id: uuid.UUID) -> Project | None:
        result = await self.session.scalars(
            select(Project)
            .options(selectinload(Project.members).selectinload(ProjectMember.user))
            .where(Project.id == id)
        )
        return result.first()

    async def get_all_with_members(self, include_archived: bool = False) -> list[Project]:
        stmt = select(Project).options(selectinload(Project.members).selectinload(ProjectMember.user))
        if not include_archived:
            stmt = stmt.where(Project.is_archived == False)  # noqa: E712
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_by_key(self, key: str) -> Project | None:
        result = await self.session.scalars(select(Project).where(Project.key == key))
        return result.first()

    async def archive_project(self, project_id: uuid.UUID) -> None:
        """Archive project and all its issues."""
        project = await self.get_by_id(project_id)
        if project:
            project.is_archived = True
            await self.session.flush()

        await self.session.execute(update(Issue).where(Issue.project_id == project_id).values(is_archived=True))
        await self.session.flush()

    async def unarchive_project(self, project_id: uuid.UUID) -> None:
        """Unarchive project and all its issues."""
        project = await self.get_by_id(project_id)
        if project:
            project.is_archived = False
            await self.session.flush()

        await self.session.execute(update(Issue).where(Issue.project_id == project_id).values(is_archived=False))
        await self.session.flush()

    async def archive_member(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await self.session.scalars(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )
        member = result.first()
        if member:
            member.is_archived = True
            await self.session.flush()
            return True
        return False

    async def unarchive_member(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await self.session.scalars(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )
        member = result.first()
        if member:
            member.is_archived = False
            await self.session.flush()
            return True
        return False

    async def add_member(self, project_id: uuid.UUID, user_id: uuid.UUID, role: str = "member") -> ProjectMember:
        member = ProjectMember(project_id=project_id, user_id=user_id, role=role)
        self.session.add(member)
        await self.session.flush()
        return member

    async def bulk_delete(self, project_ids: list[uuid.UUID]) -> None:
        """Bulk delete projects and their issues (cascade)."""
        await self.session.execute(sa_delete(Issue).where(Issue.project_id.in_(project_ids)))
        await self.session.execute(sa_delete(ProjectMember).where(ProjectMember.project_id.in_(project_ids)))
        await self.session.execute(sa_delete(Project).where(Project.id.in_(project_ids)))
        await self.session.flush()

    async def bulk_archive_projects(self, project_ids: list[uuid.UUID]) -> None:
        """Bulk archive projects and their issues."""
        await self.session.execute(update(Project).where(Project.id.in_(project_ids)).values(is_archived=True))
        await self.session.execute(update(Issue).where(Issue.project_id.in_(project_ids)).values(is_archived=True))
        await self.session.flush()

    async def bulk_delete_members(self, project_id: uuid.UUID, user_ids: list[uuid.UUID]) -> None:
        """Bulk delete members from a project."""
        await self.session.execute(
            sa_delete(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id.in_(user_ids),
            )
        )
        await self.session.flush()

    async def bulk_archive_members(self, project_id: uuid.UUID, user_ids: list[uuid.UUID]) -> None:
        """Bulk archive members in a project."""
        await self.session.execute(
            update(ProjectMember)
            .where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id.in_(user_ids),
            )
            .values(is_archived=True)
        )
        await self.session.flush()

    async def remove_member(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await self.session.scalars(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )
        member = result.first()
        if member:
            await self.session.delete(member)
            await self.session.flush()
            return True
        return False
