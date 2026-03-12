# GantChart - Project Management System

Backlogに類似したプロジェクト管理アプリケーション。ガントチャート機能を中心に、プロジェクト/課題管理、タスク依存関係、マイルストーン、ユーザーアサインを備える。

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 16.1.6 |
| Frontend | React | 19.2.3 |
| Frontend | TypeScript | 5 |
| Frontend | Tailwind CSS | 4 |
| Frontend | TanStack React Query | 5.90.21 |
| Frontend | Zod | 4.3.6 |
| Frontend | Shadcn UI / Radix UI | Latest |
| Frontend | Vitest + Testing Library | 4.0.18 |
| Backend | FastAPI | 0.115.0+ |
| Backend | Python | 3.12+ |
| Backend | SQLAlchemy (async) | 2.0+ |
| Backend | Pydantic | 2.0+ |
| Backend | Alembic | 1.13.0+ |
| Backend | pytest + httpx | 8.0+ |
| Database | PostgreSQL | 16 |
| Build Tool | Bun | 1.x |
| Infrastructure | Docker Compose | - |
| Deploy (FE) | Vercel | - |
| Deploy (BE) | Fly.io | - |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Bun (frontend build tool)
- Python 3.12+ (backend)

### Docker Compose (recommended)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services
docker compose up

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (requires PostgreSQL running)
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
bun install

# Start dev server
bun run dev
```

## Environment Variables

<!-- AUTO-GENERATED:ENV_TABLE -->
| Variable | Required | Scope | Description | Default |
|----------|----------|-------|-------------|---------|
| `POSTGRES_USER` | Yes | Docker | PostgreSQL user | `gantchart` |
| `POSTGRES_PASSWORD` | Yes | Docker | PostgreSQL password | `gantchart_dev` |
| `POSTGRES_DB` | Yes | Docker | PostgreSQL database name | `gantchart` |
| `DATABASE_URL` | Yes | Backend | Async PostgreSQL connection string | `postgresql+asyncpg://gantchart:gantchart_dev@db:5432/gantchart` |
| `CORS_ORIGINS` | Yes | Backend | Comma-separated allowed origins | `http://localhost:3000` |
| `BACKEND_HOST` | No | Backend | Server bind host | `0.0.0.0` |
| `BACKEND_PORT` | No | Backend | Server bind port | `8000` |
| `API_KEY` | No | Backend | API key for authentication | _(empty)_ |
| `RATE_LIMIT` | No | Backend | Rate limit configuration | `60/minute` |
| `NEXT_PUBLIC_API_URL` | Yes | Frontend | Backend API base URL | `http://localhost:8000` |
<!-- AUTO-GENERATED:ENV_TABLE -->

Environment switching:
- **Development**: `backend/.env` + `frontend/.env.local`
- **Production**: `backend/.env.production` + `frontend/.env.production`

## Available Commands

### Frontend

<!-- AUTO-GENERATED:FE_SCRIPTS -->
| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Production build with type checking |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run test` | Run tests in watch mode (Vitest) |
| `bun run test:run` | Run tests once |
| `bun run test:coverage` | Run tests with coverage report |
<!-- AUTO-GENERATED:FE_SCRIPTS -->

### Backend

<!-- AUTO-GENERATED:BE_SCRIPTS -->
| Command | Description |
|---------|-------------|
| `uvicorn app.main:app --reload` | Start development server |
| `pytest tests/ -v` | Run all tests with verbose output |
| `pytest --cov=app tests/` | Run tests with coverage report |
| `alembic revision --autogenerate -m "message"` | Create new migration |
| `alembic upgrade head` | Apply all migrations |
| `alembic downgrade -1` | Rollback last migration |
<!-- AUTO-GENERATED:BE_SCRIPTS -->

## API Endpoints

<!-- AUTO-GENERATED:API_ENDPOINTS -->
### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |

### Users `/users`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users` | List all users (`?include_archived=true` for archived) |
| `POST` | `/users` | Create user (katakana validation on `name_kana`) |
| `GET` | `/users/{user_id}` | Get user by ID |
| `PATCH` | `/users/{user_id}` | Update user |
| `DELETE` | `/users/{user_id}` | Delete user |
| `POST` | `/users/{user_id}/archive` | Archive user |
| `POST` | `/users/{user_id}/unarchive` | Unarchive user |
| `POST` | `/users/bulk-delete` | Bulk delete users (max 100, body: `{ids: [...]}`) |
| `POST` | `/users/bulk-archive` | Bulk archive users (max 100, body: `{ids: [...]}`) |

### Projects `/projects`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | Create project |
| `GET` | `/projects/{project_id}` | Get project with members |
| `PATCH` | `/projects/{project_id}` | Update project |
| `DELETE` | `/projects/{project_id}` | Delete project (cascade) |
| `POST` | `/projects/{project_id}/archive` | Archive project (cascades to issues) |
| `POST` | `/projects/{project_id}/unarchive` | Unarchive project (cascades to issues) |
| `POST` | `/projects/bulk-delete` | Bulk delete projects (max 100, body: `{ids: [...]}`) |
| `POST` | `/projects/bulk-archive` | Bulk archive projects (max 100, body: `{ids: [...]}`) |

### Project Members

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects/{project_id}/members` | List project members |
| `POST` | `/projects/{project_id}/members` | Add member to project |
| `DELETE` | `/projects/{project_id}/members/{user_id}` | Remove member |
| `POST` | `/projects/{project_id}/members/{user_id}/archive` | Archive member |
| `POST` | `/projects/{project_id}/members/{user_id}/unarchive` | Unarchive member |
| `POST` | `/projects/{project_id}/members/bulk-delete` | Bulk delete members (max 100) |
| `POST` | `/projects/{project_id}/members/bulk-archive` | Bulk archive members (max 100) |

### Issues

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects/{project_id}/issues` | List issues (filterable by status, priority, assignee, milestone) |
| `POST` | `/projects/{project_id}/issues` | Create issue (auto-generates issue_key, supports `parent_id`) |
| `PATCH` | `/projects/{project_id}/issues/bulk` | Bulk update issues (for Gantt drag) |
| `POST` | `/projects/{project_id}/issues/bulk-delete` | Bulk delete issues (max 100, body: `{ids: [...]}`) |
| `POST` | `/projects/{project_id}/issues/bulk-archive` | Bulk archive issues (max 100, body: `{ids: [...]}`) |
| `GET` | `/issues/{issue_id}` | Get issue detail |
| `PATCH` | `/issues/{issue_id}` | Update issue |
| `DELETE` | `/issues/{issue_id}` | Delete issue |
| `POST` | `/issues/{issue_id}/archive` | Archive issue |
| `POST` | `/issues/{issue_id}/unarchive` | Unarchive issue |

### Comments & Attachments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/issues/{issue_id}/comments` | List comments for issue |
| `POST` | `/issues/{issue_id}/comments` | Create comment (supports markdown) |
| `PATCH` | `/comments/{comment_id}` | Update comment |
| `DELETE` | `/comments/{comment_id}` | Delete comment |
| `POST` | `/issues/{issue_id}/attachments` | Upload attachment |
| `GET` | `/issues/{issue_id}/attachments` | List attachments |

### Milestones

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects/{project_id}/milestones` | List milestones |
| `POST` | `/projects/{project_id}/milestones` | Create milestone |
| `PATCH` | `/milestones/{milestone_id}` | Update milestone |
| `DELETE` | `/milestones/{milestone_id}` | Delete milestone |

### Dependencies

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/issues/{issue_id}/dependencies` | Add dependency (circular detection) |
| `GET` | `/issues/{issue_id}/dependencies` | Get issue dependencies |
| `DELETE` | `/dependencies/{dependency_id}` | Remove dependency |

### Gantt

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects/{project_id}/gantt` | Get Gantt chart data (issues + milestones + dependencies) |
<!-- AUTO-GENERATED:API_ENDPOINTS -->

## Frontend Routes

<!-- AUTO-GENERATED:FE_ROUTES -->
| Path | Description |
|------|-------------|
| `/` | Home page |
| `/members` | Member (user) management |
| `/projects` | Project list (bulk select, archive, delete) |
| `/projects/new` | Create new project |
| `/projects/[projectId]` | Project detail with issues/members tabs |
| `/projects/[projectId]/gantt` | Gantt Chart view |
| `/projects/[projectId]/milestones` | Milestones management |
| `/projects/[projectId]/issues/new` | Create new issue |
| `/projects/[projectId]/issues/[issueId]` | Issue detail / edit / comments |
<!-- AUTO-GENERATED:FE_ROUTES -->

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ Frontend (Next.js 16 / Vercel)                      │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────────┐  │
│  │ Shadcn   │ │ TanStack │ │ Gantt Chart (SVG)   │  │
│  │ UI       │ │ Query    │ │ - Drag & Resize     │  │
│  │          │ │          │ │ - Dependency Arrows  │  │
│  │          │ │          │ │ - Milestone Markers  │  │
│  └──────────┘ └──────────┘ └─────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────────────────┐
│ Backend (FastAPI / Fly.io)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Routers  │ │ Services │ │ Repositories         │ │
│  │ (7)      │→│ (3)      │→│ (Base + 6 concrete)  │ │
│  └──────────┘ └──────────┘ └──────────┬───────────┘ │
│  ┌──────────┐ ┌──────────┐            │             │
│  │ Pydantic │ │ Alembic  │            │             │
│  │ Schemas  │ │ Migrate  │            │             │
│  └──────────┘ └──────────┘            │             │
└───────────────────────────────────────┼─────────────┘
                                        │
┌───────────────────────────────────────▼─────────────┐
│ PostgreSQL 16                                        │
│  users │ projects │ project_members │ issues         │
│  milestones │ issue_dependencies │ comments         │
└──────────────────────────────────────────────────────┘
```

## Project Structure

```
gantchart-v2/
├── .github/workflows/ci.yml    # GitHub Actions CI pipeline
├── .husky/                      # Git hooks (pre-commit, commit-msg)
├── docker-compose.yml           # 3 services: db, backend, frontend
├── .env.example                 # Environment variable template
├── package.json                 # Root: Husky + lint-staged + commitlint
├── commitlint.config.js         # Conventional commit rules
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pyproject.toml           # pytest config, coverage settings
│   ├── alembic.ini              # Alembic configuration
│   ├── alembic/
│   │   └── env.py               # Async migration support
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router includes
│   │   ├── config.py            # Pydantic Settings from .env
│   │   ├── database.py          # SQLAlchemy async engine & session
│   │   ├── models/              # 6 SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic v2 request/response schemas + bulk.py
│   │   ├── repositories/        # Repository pattern (Base + 6 concrete)
│   │   ├── routers/             # 7 API route handlers (incl. comments)
│   │   └── services/            # Business logic (issue, dependency, gantt)
│   └── tests/                   # 38 pytest tests
│       ├── conftest.py          # SQLite test DB, AsyncClient fixture
│       ├── test_users.py
│       ├── test_projects.py
│       ├── test_issues.py
│       ├── test_milestones.py
│       ├── test_dependencies.py
│       ├── test_gantt.py
│       └── test_cors.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vitest.config.ts         # Vitest + jsdom config
│   ├── src/
│   │   ├── app/                 # Next.js App Router (9 pages)
│   │   ├── components/
│   │   │   ├── ui/              # 16 Shadcn UI components
│   │   │   ├── layout/          # Header, Sidebar
│   │   │   ├── gantt/           # GanttChart, GanttBar, GanttMilestone
│   │   │   ├── issues/          # IssueTable, IssueComments, KanbanBoard
│   │   │   ├── members/         # MemberList
│   │   │   └── shared/          # MarkdownEditor
│   │   ├── hooks/               # 7 TanStack Query hooks
│   │   ├── lib/                 # api-client, validators (Zod), gantt-utils
│   │   ├── types/               # TypeScript type definitions
│   │   └── providers/           # QueryClientProvider
│   └── __tests__/               # 42 Vitest tests
│       ├── lib/
│       │   ├── gantt-utils.test.ts   # 16 tests
│       │   └── validators.test.ts    # 13 tests
│       └── components/
│           └── issues/
│               └── IssueTable.test.tsx  # 5 tests
│
└── docs/
    ├── PLAN.md                  # Implementation plan (9 phases)
    ├── lib-nextjs.md            # Next.js v16 reference
    ├── lib-fastapi.md           # FastAPI reference
    ├── lib-tanstack-query.md    # TanStack Query v5 reference
    ├── lib-shadcn-ui.md         # Shadcn UI reference
    ├── lib-zod.md               # Zod v4 reference
    ├── lib-sqlalchemy.md        # SQLAlchemy 2.0 async reference
    ├── lib-vitest.md            # Vitest v4 reference
    ├── lib-alembic.md           # Alembic reference
    └── lib-playwright.md        # Playwright reference
```

## Testing

### Backend (38 tests)

```bash
cd backend

# Run all tests
pytest tests/ -v

# With coverage
pytest --cov=app tests/

# Single test file
pytest tests/test_dependencies.py -v
```

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `test_users.py` | 7 | CRUD, duplicate email, not found |
| `test_projects.py` | 8 | CRUD, key uniqueness, member management |
| `test_issues.py` | 7 | CRUD, auto key, filters, date validation, bulk update |
| `test_milestones.py` | 4 | CRUD |
| `test_dependencies.py` | 5 | Create, self-dep, circular detection, delete |
| `test_gantt.py` | 3 | Empty project, data shape, dependencies |
| `test_cors.py` | 4 | CORS headers, allowed origins |

### Frontend (42 tests)

```bash
cd frontend

# Run all tests
bun run test:run

# With coverage
bun run test:coverage

# Watch mode
bun run test
```

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `gantt-utils.test.ts` | 16 | dateToPixel, pixelToDate, bar calculation, date range |
| `validators.test.ts` | 13 | Project, issue, milestone schema validation |
| `IssueTable.test.tsx` | 5 | Rendering, badges, empty state |

## CI/CD

### GitHub Actions

Push/PR to `main` or `develop` triggers the CI pipeline (`.github/workflows/ci.yml`):

| Job | Trigger | Description |
|-----|---------|-------------|
| `frontend-lint` | Push/PR | TypeScript type check + ESLint |
| `frontend-test` | Push/PR | Vitest with coverage report |
| `frontend-build` | Push/PR | Next.js production build (after lint+test) |
| `backend-lint` | Push/PR | Ruff check + format check |
| `backend-test` | Push/PR | pytest with PostgreSQL service container |
| `docker-build` | Push to main | Docker image build verification |
| `commitlint` | PR only | Conventional commit message validation |

### Git Hooks (Husky)

Installed automatically via `npm install` at root:

| Hook | Tool | Action |
|------|------|--------|
| `pre-commit` | lint-staged | Lint & format staged files (ESLint for TS/TSX, Ruff for Python) |
| `commit-msg` | commitlint | Enforce conventional commit format (`feat:`, `fix:`, etc.) |

### Linting Tools

| Scope | Tool | Config |
|-------|------|--------|
| Frontend | ESLint + TypeScript | `frontend/eslint.config.mjs` |
| Backend | Ruff (check + format) | `backend/pyproject.toml [tool.ruff]` |
| Commits | commitlint | `commitlint.config.js` |

### Setup

```bash
# Install root hooks (auto-runs on npm install via "prepare" script)
npm install

# Verify hooks are active
ls -la .husky/

# Manual ruff check (backend)
cd backend && ruff check . && ruff format --check .

# Manual eslint check (frontend)
cd frontend && bun run lint && bun run typecheck
```

## Deployment

### Frontend (Vercel)

1. Connect repository to Vercel
2. Set root directory to `frontend`
3. Set build command: `bun run build`
4. Add environment variable: `NEXT_PUBLIC_API_URL`

### Backend (Fly.io)

```bash
cd backend

# Launch app
fly launch

# Set secrets
fly secrets set DATABASE_URL="postgresql+asyncpg://..."
fly secrets set CORS_ORIGINS="https://your-frontend.vercel.app"

# Deploy
fly deploy
```

## License

Private
