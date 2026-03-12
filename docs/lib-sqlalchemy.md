# SQLAlchemy 2.0 (Async) - Library Reference

> Source: Context7 MCP (`/websites/sqlalchemy_en_20`)

## Version

SQLAlchemy 2.0 with asyncpg driver

## Async Engine Setup

```python
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    "postgresql+asyncpg://user:password@localhost/dbname",
    echo=True,
)
```

## Declarative Base with AsyncAttrs

```python
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase

class Base(AsyncAttrs, DeclarativeBase):
    pass
```

## Model Definition (Mapped Columns)

```python
from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
import datetime
from typing import List, Optional

class A(Base):
    __tablename__ = "a"

    id: Mapped[int] = mapped_column(primary_key=True)
    data: Mapped[Optional[str]]
    create_date: Mapped[datetime.datetime] = mapped_column(
        server_default=func.now()
    )
    bs: Mapped[List[B]] = relationship()


class B(Base):
    __tablename__ = "b"

    id: Mapped[int] = mapped_column(primary_key=True)
    a_id: Mapped[int] = mapped_column(ForeignKey("a.id"))
    data: Mapped[Optional[str]]
```

## UUID Primary Key (PostgreSQL)

```python
import uuid
from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import UUID

class A(Base):
    __tablename__ = "a"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data = Column(UUID)
```

### Mapped Column Style

```python
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255))
```

## Async Session

```python
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

async_session = async_sessionmaker(engine, expire_on_commit=False)

async with async_session() as session:
    async with session.begin():
        session.add_all([...])
```

## Queries

```python
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

# Basic select
stmt = select(A).where(A.id == 1)
result = await session.scalars(stmt)
item = result.first()

# Eager loading relationships
stmt = select(A).options(selectinload(A.bs))
result = await session.scalars(stmt)

# Streaming results
result = await session.stream(stmt)
async for a1 in result.scalars():
    print(a1)
```

## Schema Creation

```python
async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
```

## FastAPI Dependency

```python
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

## Key Dependencies

```
sqlalchemy[asyncio]>=2.0
asyncpg
alembic
```

## 本プロジェクトでの注意点

- `AsyncAttrs`と`DeclarativeBase`を必ず組み合わせる
- リレーションシップのロードには`selectinload`を使用（asyncではlazy loadが使えない）
- `expire_on_commit=False`を設定してコミット後の属性アクセスを可能にする
- UUIDはPostgreSQL native型 (`PG_UUID(as_uuid=True)`) を使用
