import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.dependency import DependencyRepository
from app.repositories.issue import IssueRepository
from app.repositories.milestone import MilestoneRepository
from app.schemas.dependency import DependencyResponse
from app.schemas.gantt import GanttResponse
from app.schemas.issue import IssueResponse
from app.schemas.milestone import MilestoneResponse


class GanttService:
    def __init__(self, session: AsyncSession):
        self.issue_repo = IssueRepository(session)
        self.milestone_repo = MilestoneRepository(session)
        self.dep_repo = DependencyRepository(session)

    async def get_gantt_data(self, project_id: uuid.UUID) -> GanttResponse:
        issues = await self.issue_repo.get_by_project_for_gantt(project_id)
        milestones = await self.milestone_repo.get_by_project(project_id)

        issue_ids = [issue.id for issue in issues]
        dependencies = await self.dep_repo.get_by_project_issues(issue_ids)

        return GanttResponse(
            issues=[IssueResponse.model_validate(i) for i in issues],
            milestones=[MilestoneResponse.model_validate(m) for m in milestones],
            dependencies=[DependencyResponse.model_validate(d) for d in dependencies],
        )
