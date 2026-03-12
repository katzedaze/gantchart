import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.gantt import GanttResponse
from app.services.gantt_service import GanttService

router = APIRouter()


@router.get("/projects/{project_id}/gantt", response_model=GanttResponse)
async def get_gantt_data(project_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = GanttService(db)
    return await service.get_gantt_data(project_id)
