import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class SkillProgress(Base):
    __tablename__ = "skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "roadmap_slug", "node_id", name="uq_skill_progress"),)

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    roadmap_slug: Mapped[str] = mapped_column(String(100), nullable=False)
    node_id: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[str] = mapped_column(String(20), nullable=False, server_default="none")
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
