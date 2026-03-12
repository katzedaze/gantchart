import asyncio
import os
from logging.config import fileConfig

from alembic import context
from app.database import Base
from app.models import (  # noqa: F401
    Issue,
    IssueDependency,
    Milestone,
    Project,
    ProjectMember,
    User,
)
from app.models.comment import Attachment, Comment  # noqa: F401
from app.models.skill_progress import SkillProgress  # noqa: F401
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

config = context.config

database_url = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://gantchart:gantchart_dev@localhost:5432/gantchart",
)
config.set_main_option("sqlalchemy.url", database_url)

target_metadata = Base.metadata

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


run_migrations_online()
