# FastAPI - Library Reference

> Source: Context7 MCP (`/websites/fastapi_tiangolo`)

## Version

FastAPI 0.128.0+ / Pydantic v2

## Pydantic v2 Models

```python
from pydantic import BaseModel

class Invoice(BaseModel):
    id: str
    title: str | None = None
    customer: str
    total: float
```

## APIRouter

```python
from fastapi import APIRouter

router = APIRouter()

@router.post("/invoices/")
def create_invoice(invoice: Invoice):
    return {"msg": "Invoice received"}
```

## Dependency Injection

```python
from typing import Annotated
from fastapi import Depends, FastAPI

app = FastAPI()

async def common_parameters(q: str | None = None, skip: int = 0, limit: int = 100):
    return {"q": q, "skip": skip, "limit": limit}

@app.get("/items/")
async def read_items(commons: Annotated[dict, Depends(common_parameters)]):
    return commons
```

### Yieldを使ったDependency（セットアップ/ティアダウン）

```python
async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()
```

## CORS Middleware

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Async Testing with pytest

```python
import pytest
from httpx import ASGITransport, AsyncClient
from .main import app

@pytest.mark.anyio
async def test_root():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Tomato"}
```

## Project Structure (Recommended)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app entry
│   ├── config.py         # Pydantic Settings
│   ├── database.py       # SQLAlchemy engine/session
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic v2 schemas
│   ├── repositories/     # Data access layer
│   ├── routers/          # API route handlers
│   ├── services/         # Business logic
│   └── utils/            # Utilities
├── tests/
├── alembic/
├── pyproject.toml
└── Dockerfile
```

## Key Dependencies

```
fastapi>=0.128.0
uvicorn[standard]
sqlalchemy[asyncio]>=2.0
asyncpg
pydantic>=2.0
pydantic-settings
alembic
httpx
pytest
pytest-anyio
```
