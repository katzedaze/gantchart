import uuid
from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dependency import IssueDependency
from app.repositories.dependency import DependencyRepository
from app.repositories.issue import IssueRepository


class DependencyService:
    def __init__(self, session: AsyncSession):
        self.dep_repo = DependencyRepository(session)
        self.issue_repo = IssueRepository(session)

    async def create_dependency(
        self,
        successor_id: uuid.UUID,
        predecessor_id: uuid.UUID,
        dependency_type: str = "FS",
    ) -> IssueDependency:
        if successor_id == predecessor_id:
            raise HTTPException(status_code=400, detail="Cannot create self-dependency")

        successor = await self.issue_repo.get_by_id(successor_id)
        predecessor = await self.issue_repo.get_by_id(predecessor_id)
        if not successor or not predecessor:
            raise HTTPException(status_code=404, detail="Issue not found")

        if successor.project_id != predecessor.project_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot create cross-project dependency",
            )

        if await self._would_create_cycle(predecessor_id, successor_id, successor.project_id):
            raise HTTPException(status_code=400, detail="Circular dependency detected")

        return await self.dep_repo.create(
            predecessor_id=predecessor_id,
            successor_id=successor_id,
            dependency_type=dependency_type,
        )

    async def _would_create_cycle(
        self,
        predecessor_id: uuid.UUID,
        successor_id: uuid.UUID,
        project_id: uuid.UUID,
    ) -> bool:
        """Check if adding edge would create a cycle (scoped to project)."""
        project_issues = await self.issue_repo.get_by_project(project_id)
        project_issue_ids = {issue.id for issue in project_issues}

        project_deps = await self.dep_repo.get_by_project_issues(list(project_issue_ids))

        graph: dict[uuid.UUID, list[uuid.UUID]] = defaultdict(list)
        for dep in project_deps:
            graph[dep.predecessor_id].append(dep.successor_id)

        visited: set[uuid.UUID] = set()
        stack = [successor_id]
        while stack:
            node = stack.pop()
            if node == predecessor_id:
                return True
            if node in visited:
                continue
            visited.add(node)
            stack.extend(graph.get(node, []))
        return False
