# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack project management system (Backlog-like) with Gantt chart, built as a monorepo:

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
bun run test                         # Watch mode
bun run test:run                     # Single run
bun run test:coverage                # Coverage (80% threshold on lines/functions/branches/statements)
bun run lint                         # ESLint
bun run typecheck                    # tsc --noEmit
bun run build                        # Production build
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
- Services exist only where business logic is needed: `issue_service`, `dependency_service` (circular dependency detection), `gantt_service`

### Frontend Patterns

- **Data fetching**: Custom hooks in `src/hooks/` wrapping TanStack Query (`useQuery`/`useMutation`)
- **API client**: `src/lib/api-client.ts` — fetch wrapper with error handling
- **Validation**: Zod schemas in `src/lib/validators.ts`
- **UI components**: Shadcn UI (Radix-based) in `src/components/ui/`
- **Gantt chart**: Custom SVG implementation in `src/components/gantt/` with drag/resize support

### Router Registration (backend/app/main.py)

Issues, milestones, dependencies, gantt, and comments routers use nested paths under projects (e.g., `/projects/{id}/issues`). Users, projects, and skill-progress have top-level prefixes.

### Testing

- **Backend tests** use SQLite in-memory (`test.db`) with dependency overrides for `get_db` and `verify_api_key` (see `tests/conftest.py`)
- **Frontend tests** use Vitest + jsdom + Testing Library (config in `vitest.config.ts`)

## Git Conventions

- Conventional commits enforced by commitlint: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`
- Pre-commit hooks (Husky + lint-staged): ESLint --fix for TS/TSX, Ruff check+format for Python

## Environment Variables

Key variables (see `.env.example`):

- `DATABASE_URL` — PostgreSQL connection string (asyncpg)
- `NEXT_PUBLIC_API_URL` — Backend URL for frontend (default: `http://localhost:8000`)
- `CORS_ORIGINS` — Comma-separated allowed origins
- `API_KEY` — Optional API key for `X-API-Key` header auth
- `RATE_LIMIT` — Rate limit string (default: `60/minute`)
