"""remove_user_id_from_skill_progress

Revision ID: a1b2c3d4e5f6
Revises: 4747e7d87b37
Create Date: 2026-03-13 05:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "4747e7d87b37"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Drop existing unique constraint
    op.drop_constraint("uq_skill_progress", "skill_progress", type_="unique")

    # Drop foreign key constraint on user_id
    op.drop_constraint("skill_progress_user_id_fkey", "skill_progress", type_="foreignkey")

    # Drop user_id column
    op.drop_column("skill_progress", "user_id")

    # Add new unique constraint on (roadmap_slug, node_id) only
    op.create_unique_constraint(
        "uq_skill_progress_roadmap_node",
        "skill_progress",
        ["roadmap_slug", "node_id"],
    )


def downgrade() -> None:
    # Drop new constraint
    op.drop_constraint("uq_skill_progress_roadmap_node", "skill_progress", type_="unique")

    # Re-add user_id column
    op.add_column(
        "skill_progress",
        sa.Column("user_id", sa.UUID(), nullable=True),
    )

    # Re-add foreign key
    op.create_foreign_key(
        "skill_progress_user_id_fkey",
        "skill_progress",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Re-add original unique constraint
    op.create_unique_constraint(
        "uq_skill_progress",
        "skill_progress",
        ["user_id", "roadmap_slug", "node_id"],
    )
