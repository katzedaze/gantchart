from pydantic import BaseModel

from app.schemas.dependency import DependencyResponse
from app.schemas.issue import IssueResponse
from app.schemas.milestone import MilestoneResponse


class GanttResponse(BaseModel):
    issues: list[IssueResponse]
    milestones: list[MilestoneResponse]
    dependencies: list[DependencyResponse]
