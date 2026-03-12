# Alembic - Library Reference

> Source: Context7 MCP (`/sqlalchemy/alembic`)

## Version

Latest (with SQLAlchemy 2.0 async support)

## Installation

```bash
pip install alembic
```

## Initialization

```bash
cd backend
alembic init alembic
```

## Async Configuration (env.py)

FastAPI + SQLAlchemy async環境でのAlembic設定:

```python
# alembic/env.py
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import models for autogenerate
from app.database import Base
from app.models import user, project, issue, milestone, dependency  # noqa

config = context.config
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
```

## alembic.ini Configuration

```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql+asyncpg://user:password@localhost:5432/dbname
```

## Programmatic Migration (アプリ起動時)

```python
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import command, config


def run_upgrade(connection, cfg):
    cfg.attributes["connection"] = connection
    command.upgrade(cfg, "head")


async def run_async_upgrade():
    async_engine = create_async_engine(
        "postgresql+asyncpg://user:password@localhost/dbname",
        echo=True,
    )
    async with async_engine.begin() as conn:
        await conn.run_sync(run_upgrade, config.Config("alembic.ini"))


asyncio.run(run_async_upgrade())
```

## Common Commands

```bash
# マイグレーション作成 (autogenerate)
alembic revision --autogenerate -m "initial schema"

# マイグレーション適用
alembic upgrade head

# ロールバック
alembic downgrade -1

# 現在のリビジョン確認
alembic current

# 履歴表示
alembic history
```

## Autogenerate Setup

`env.py`で`target_metadata`にBase.metadataを設定することで、モデルとDBスキーマの差分を自動検出:

```python
from app.database import Base
from app.models import user, project, issue, milestone, dependency  # 全モデルをインポート

target_metadata = Base.metadata
```

## 注意点

- async driverを使用する場合、`env.py`でasyncパターンが必須
- `compare_type=True`で型変更も検出
- モデルファイルは必ず`env.py`でインポートしてautogenerateに認識させる
- `poolclass=pool.NullPool`でマイグレーション時のコネクションプーリングを無効化
