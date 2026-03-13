# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack project management system (Backlog-like) with Gantt chart and developer tools, built as a monorepo:

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS 4 + TanStack Query 5 + Zod 4
- **Backend**: FastAPI + Python 3.12 + SQLAlchemy 2.0 (async) + PostgreSQL 16
- **Package manager**: Bun (frontend), pip (backend)

## Common Commands

### Development

```bash
docker compose up                    # Start all services (db, backend, frontend)
cd backend && uvicorn app.main:app --reload --port 8000   # Backend only
cd frontend && bun run dev           # Frontend only
```

### Backend

```bash
cd backend
pytest tests/ -v                     # Run all tests
pytest tests/test_users.py -v        # Single test file
pytest --cov=app tests/              # With coverage (80% minimum, enforced)
ruff check . && ruff format --check .  # Lint + format check
ruff check --fix . && ruff format .    # Auto-fix
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                 # Apply migrations
```

### Frontend

```bash
cd frontend
bun run dev                          # Start dev server
bun run build                        # Production build
bun run start                        # Start production server
bun run lint                         # ESLint
bun run typecheck                    # tsc --noEmit
bun run test                         # Vitest watch mode
bun run test:run                     # Single run
bun run test:coverage                # Coverage (80% threshold on lines/functions/branches/statements)
```

## Architecture

### Backend Layering

```
Routers (app/routers/) → Services (app/services/) → Repositories (app/repositories/) → Models (app/models/)
```

- **Repository pattern**: `BaseRepository[T]` provides generic CRUD; concrete repos extend it
- **All DB operations are async** via `asyncpg` + SQLAlchemy async sessions
- **Dependency injection**: `Depends(get_db)` for sessions, `Depends(verify_api_key)` for auth
- **Session lifecycle**: auto-commit on success, rollback on exception (see `database.py:get_db`)
- **Rate limiting**: `slowapi` with configurable `RATE_LIMIT` (default `60/minute`)
- Services exist only where business logic is needed: `issue_service`, `dependency_service` (circular dependency detection), `gantt_service`

### Backend Models

`user`, `project`, `issue`, `milestone`, `dependency`, `comment`, `skill_progress`

### Router Registration (backend/app/main.py)

| Router | Prefix | Notes |
|--------|--------|-------|
| `users` | `/users` | Top-level |
| `projects` | `/projects` | Top-level |
| `skill_progress` | `/skill-progress` | Top-level |
| `issues` | nested under projects | e.g., `/projects/{id}/issues` |
| `milestones` | nested under projects | |
| `dependencies` | nested under projects | |
| `gantt` | nested under projects | |
| `comments` | nested under projects | |

Static file serving: `/uploads` directory mounted for uploaded files.
Health check: `GET /health`

### Frontend Patterns

- **Data fetching**: Custom hooks in `src/hooks/` wrapping TanStack Query (`useQuery`/`useMutation`)
  - `useProjects`, `useIssues`, `useGantt`, `useMilestones`, `useComments`, `useMembers`, `useUsers`, `useSkillProgress`
- **API client**: `src/lib/api-client.ts` — fetch wrapper with error handling
- **Validation**: Zod schemas in `src/lib/validators.ts`
- **Utilities**: `src/lib/gantt-utils.ts` (Gantt helpers), `src/lib/translate.ts` (translation), `src/lib/utils.ts` (general)
- **UI components**: Shadcn UI (Radix-based) in `src/components/ui/`
- **Gantt chart**: Custom SVG implementation in `src/components/gantt/` (`GanttChart`, `GanttBar`, `GanttMilestone`)
- **Layout**: `src/components/layout/` (`Header`, `Sidebar`)
- **Feature components**: `src/components/issues/` (IssueTable, KanbanBoard, IssueComments, WorkHoursTable), `src/components/members/` (MemberList), `src/components/shared/` (MarkdownEditor)

### Frontend Pages (App Router)

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/projects` | Project list |
| `/projects/new` | Create project |
| `/projects/[projectId]` | Project detail (issue board) |
| `/projects/[projectId]/issues/new` | Create issue |
| `/projects/[projectId]/issues/[issueId]` | Issue detail |
| `/projects/[projectId]/milestones` | Milestones |
| `/projects/[projectId]/gantt` | Gantt chart |
| `/members` | Member management |
| `/tools` | Developer tools hub |
| `/tools/base64` | Base64 encoder/decoder |
| `/tools/case-converter` | Case converter |
| `/tools/dummy-image` | Dummy image generator |
| `/tools/image-whiteout` | Image whiteout tool |
| `/tools/json-formatter` | JSON formatter |
| `/tools/jwt-decoder` | JWT decoder |
| `/tools/qr-generator` | QR code generator |
| `/tools/skill-checker` | Skill checker with roadmap.sh integration |

API routes: `/api/translate`, `/api/roadmap/[...path]` (proxy)

### Testing

- **Backend tests** use SQLite in-memory (`test.db`) with dependency overrides for `get_db` and `verify_api_key` (see `tests/conftest.py`)
- **Frontend tests** use Vitest + jsdom + Testing Library (config in `vitest.config.ts`)

## Git Conventions

- Conventional commits enforced by commitlint: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`
- Pre-commit hooks (Husky + lint-staged): ESLint --fix for TS/TSX, Ruff check+format for Python

## Environment Variables

Key variables (see `.env.example`):

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `POSTGRES_USER` | No | PostgreSQL username | `gantchart` |
| `POSTGRES_PASSWORD` | No | PostgreSQL password | `gantchart_dev` |
| `POSTGRES_DB` | No | PostgreSQL database name | `gantchart` |
| `DATABASE_URL` | Yes | PostgreSQL connection string (asyncpg) | — |
| `BACKEND_HOST` | No | Backend bind address | `0.0.0.0` |
| `BACKEND_PORT` | No | Backend port | `8000` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins | `http://localhost:3000` |
| `API_KEY` | No | API key for `X-API-Key` header auth | empty (disabled) |
| `RATE_LIMIT` | No | Rate limit string | `60/minute` |
| `NEXT_PUBLIC_API_URL` | No | Backend URL for frontend | `http://localhost:8000` |
