# Implementation Plan: Backlog-like Project Management System with Gantt Chart

## Overview

Backlogに類似したプロジェクト管理アプリケーション。ガントチャート機能を中心に、プロジェクト/課題管理、タスク依存関係、マイルストーン、ユーザーアサインを備える。

---

## 1. Requirements

### Functional Requirements

- **Project Management**: プロジェクトのCRUD。各プロジェクトはname, key(短縮識別子), description, membersを持つ
- **Issue/Task Management**: プロジェクト内の課題CRUD。type(Task/Bug/Story), status(Open/In Progress/Resolved/Closed), priority(Low/Medium/High/Critical), assignee, start_date, due_date, estimated/actual hours
- **Gantt Chart**: プロジェクト内課題のタイムライン表示。ドラッグによる日付変更・リサイズ。依存関係の矢印表示
- **Task Dependencies**: 課題間のfinish-to-start依存関係定義。循環依存の防止。遅延警告のカスケード
- **Milestones**: プロジェクト内の名前付き日付マーカー。ガントチャート上にダイヤモンドマーカーで表示。課題との関連付け
- **User Assignment**: プロジェクト・課題へのユーザーアサイン。担当者によるフィルタリング

### Non-Functional Requirements

- 最低80%のテストカバレッジ (フロントエンド・バックエンド両方)
- `.env`ファイルによる環境ベースの設定切り替え
- Docker Composeによるローカル開発環境 (frontend + backend + database)
- フロントエンドはVercel、バックエンドはFly.ioにデプロイ
- Zod(フロントエンド)とPydantic(バックエンド)による入力バリデーション
- イミュータブルデータパターンの使用

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js v16, Bun, TypeScript, Shadcn UI, TanStack Query, Zod |
| Backend | FastAPI, Python 3.12+, Pydantic v2, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 |
| Dev Environment | Docker, Docker Compose |
| Testing (FE) | Vitest, React Testing Library, Playwright |
| Testing (BE) | pytest, pytest-asyncio, httpx |
| Deployment | Vercel (frontend), Fly.io (backend) |

---

## 2. Architecture Overview

```
  Vercel (Frontend)          Fly.io (Backend)         PostgreSQL
┌─────────────────┐    ┌──────────────────────┐    ┌──────────┐
│ Next.js v16     │───→│ FastAPI              │───→│ PG 16    │
│ Shadcn UI       │REST│ SQLAlchemy 2.0       │    │          │
│ TanStack Query  │JSON│ Pydantic v2          │    │          │
│ Zod             │    │ Alembic migrations   │    │          │
└─────────────────┘    └──────────────────────┘    └──────────┘
```

### Directory Structure

```
gantchart-v2/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx        # Project list
│   │   │   │   ├── new/page.tsx    # Create project
│   │   │   │   └── [projectId]/
│   │   │   │       ├── page.tsx    # Project detail
│   │   │   │       ├── issues/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   ├── new/page.tsx
│   │   │   │       │   └── [issueId]/page.tsx
│   │   │   │       ├── gantt/page.tsx
│   │   │   │       └── milestones/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # Shadcn UI primitives
│   │   │   ├── layout/             # Header, Sidebar, etc.
│   │   │   ├── projects/           # Project-related components
│   │   │   ├── issues/             # Issue-related components
│   │   │   ├── gantt/              # Gantt Chart components
│   │   │   │   ├── GanttChart.tsx
│   │   │   │   ├── GanttRow.tsx
│   │   │   │   ├── GanttBar.tsx
│   │   │   │   ├── GanttHeader.tsx
│   │   │   │   ├── GanttDependencyArrow.tsx
│   │   │   │   ├── GanttMilestone.tsx
│   │   │   │   └── GanttToolbar.tsx
│   │   │   └── milestones/         # Milestone components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utilities, API client, constants
│   │   │   ├── api-client.ts       # Fetch wrapper
│   │   │   ├── validators.ts       # Zod schemas
│   │   │   └── utils.ts
│   │   ├── types/                  # TypeScript type definitions
│   │   └── providers/              # TanStack Query provider, etc.
│   ├── __tests__/                  # Vitest unit/integration tests
│   ├── e2e/                        # Playwright E2E tests
│   ├── public/
│   ├── bun.lock
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   ├── components.json             # Shadcn UI config
│   ├── .env.local                  # Dev environment variables
│   └── .env.production             # Prod environment variables
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Settings from .env
│   │   ├── database.py             # SQLAlchemy engine/session
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── project.py
│   │   │   ├── issue.py
│   │   │   ├── milestone.py
│   │   │   ├── dependency.py
│   │   │   └── user.py
│   │   ├── schemas/                # Pydantic v2 request/response schemas
│   │   │   ├── project.py
│   │   │   ├── issue.py
│   │   │   ├── milestone.py
│   │   │   ├── dependency.py
│   │   │   └── user.py
│   │   ├── repositories/           # Repository pattern for data access
│   │   │   ├── base.py
│   │   │   ├── project.py
│   │   │   ├── issue.py
│   │   │   ├── milestone.py
│   │   │   └── dependency.py
│   │   ├── routers/                # FastAPI route handlers
│   │   │   ├── projects.py
│   │   │   ├── issues.py
│   │   │   ├── milestones.py
│   │   │   ├── dependencies.py
│   │   │   ├── gantt.py
│   │   │   └── users.py
│   │   ├── services/               # Business logic layer
│   │   │   ├── project_service.py
│   │   │   ├── issue_service.py
│   │   │   ├── dependency_service.py
│   │   │   └── gantt_service.py
│   │   └── utils/                  # Shared utilities
│   ├── alembic/                    # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   ├── tests/                      # pytest tests
│   │   ├── conftest.py
│   │   ├── test_projects.py
│   │   ├── test_issues.py
│   │   ├── test_milestones.py
│   │   ├── test_dependencies.py
│   │   └── test_gantt.py
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env                        # Dev environment variables
│   └── .env.production             # Prod environment variables
├── docker-compose.yml
├── .gitignore
├── .env.example
└── README.md
```

---

## 3. Database Schema Design

### Tables

#### users

| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK, default gen_random_uuid() |
| name | VARCHAR(255) | NOT NULL |
| name_kana | VARCHAR(255) | NOT NULL, default '' (katakana only) |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| avatar_url | TEXT | NULLABLE |
| is_archived | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

#### projects

| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| key | VARCHAR(10) | UNIQUE, NOT NULL (e.g., "PROJ") |
| description | TEXT | NULLABLE |
| is_archived | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

#### project_members

| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| project_id | UUID | FK -> projects.id, NOT NULL |
| user_id | UUID | FK -> users.id, NOT NULL |
| role | VARCHAR(20) | NOT NULL, default 'member' (admin/member) |
| is_archived | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| | | UNIQUE(project_id, user_id) |

#### milestones

| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| project_id | UUID | FK -> projects.id, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULLABLE |
| due_date | DATE | NOT NULL |
| status | VARCHAR(20) | NOT NULL, default 'open' (open/closed) |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

#### issues

| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| project_id | UUID | FK -> projects.id, NOT NULL |
| parent_id | UUID | FK -> issues.id, NULLABLE (self-ref for subtasks) |
| milestone_id | UUID | FK -> milestones.id, NULLABLE |
| assignee_id | UUID | FK -> users.id, NULLABLE |
| issue_key | VARCHAR(20) | UNIQUE, NOT NULL (e.g., "PROJ-1") |
| title | VARCHAR(500) | NOT NULL |
| description | TEXT | NULLABLE |
| issue_type | VARCHAR(20) | NOT NULL (task/bug/story) |
| status | VARCHAR(20) | NOT NULL, default 'open' |
| priority | VARCHAR(20) | NOT NULL, default 'medium' |
| start_date | DATE | NULLABLE |
| due_date | DATE | NULLABLE |
| estimated_hours | DECIMAL(8,2) | NULLABLE |
| actual_hours | DECIMAL(8,2) | NULLABLE |
| sort_order | INTEGER | NOT NULL, default 0 |
| is_archived | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

#### comments

| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| issue_id | UUID | FK -> issues.id, NOT NULL |
| author_name | VARCHAR(255) | NOT NULL |
| content | TEXT | NOT NULL (supports markdown) |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

#### issue_dependencies

| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| predecessor_id | UUID | FK -> issues.id, NOT NULL |
| successor_id | UUID | FK -> issues.id, NOT NULL |
| dependency_type | VARCHAR(10) | NOT NULL, default 'FS' (FS/SS/FF/SF) |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| | | UNIQUE(predecessor_id, successor_id) |
| | | CHECK(predecessor_id != successor_id) |

### Indexes

- `issues(project_id, status)` -- プロジェクト・ステータスによるフィルタリング
- `issues(project_id, start_date, due_date)` -- ガントチャートの日付範囲クエリ
- `issues(assignee_id)` -- 担当者によるフィルタリング
- `issues(milestone_id)` -- マイルストーンによるフィルタリング
- `issue_dependencies(predecessor_id)` -- 依存関係の検索
- `issue_dependencies(successor_id)` -- 逆方向依存関係の検索
- `project_members(user_id)` -- ユーザーのプロジェクト検索

---

## 4. Implementation Phases

### Phase 1: Project Scaffolding and Infrastructure

**Goal**: Docker Composeで全サービスが起動し通信できる状態にする

| Step | Description | Files | Risk |
|------|-------------|-------|------|
| 1.1 | Root project setup (docker-compose.yml, .gitignore, .env.example) | `docker-compose.yml`, `.gitignore`, `.env.example` | Low |
| 1.2 | Backend scaffolding (FastAPI + health endpoint + CORS + SQLAlchemy) | `backend/app/main.py`, `config.py`, `database.py`, `Dockerfile` | Low |
| 1.3 | Database migrations setup (Alembic + initial schema) | `backend/alembic/`, `alembic.ini` | Low |
| 1.4 | Frontend scaffolding (Next.js v16 + Bun + Shadcn UI + TanStack Query) | `frontend/src/app/`, `package.json`, `next.config.ts` | Medium |
| 1.5 | Testing infrastructure (Vitest, pytest, Playwright configs) | `vitest.config.ts`, `tests/conftest.py` | Low |
| 1.6 | Full stack verification | - | Low |

### Phase 2: Backend API - Core CRUD

**Goal**: Users, Projects, Issues, MilestonesのREST APIとテストカバレッジ

| Step | Description | Risk |
|------|-------------|------|
| 2.1 | User model, repository, router + tests | Low |
| 2.2 | Project model, repository, router (with member management) + tests | Low |
| 2.3 | Issue model, repository, service, router (with auto issue_key) + tests | Medium |
| 2.4 | Milestone model, repository, router + tests | Low |

### Phase 3: Backend API - Dependencies and Gantt Data

**Goal**: タスク依存関係管理（循環検出含む）とガントチャート用データエンドポイント

| Step | Description | Risk |
|------|-------------|------|
| 3.1 | Dependency model, service (circular detection via DFS), router + tests | **High** |
| 3.2 | Gantt data endpoint (`GET /projects/{id}/gantt`) + tests | Medium |
| 3.3 | Bulk update endpoint (`PATCH /projects/{id}/issues/bulk`) + tests | Medium |

### Phase 4: Frontend - Layout, Navigation, Project Management

**Goal**: プロジェクトCRUDのUIとナビゲーションシェル

| Step | Description | Risk |
|------|-------------|------|
| 4.1 | Layout and navigation shell (Header, Sidebar) | Low |
| 4.2 | API client, shared hooks, Zod schemas, TypeScript types | Low |
| 4.3 | Project list and create pages | Low |
| 4.4 | Project detail page with tabs (Issues/Gantt/Milestones/Settings) | Low |

### Phase 5: Frontend - Issue Management

**Goal**: 課題のフルCRUD UI

| Step | Description | Risk |
|------|-------------|------|
| 5.1 | Issue list page (table, filters, sorting) | Low |
| 5.2 | Issue create/edit form (Zod validation) | Low |
| 5.3 | Issue hooks and queries (TanStack Query with optimistic updates) | Low |

### Phase 6: Frontend - Gantt Chart (Core Feature)

**Goal**: インタラクティブなガントチャート

| Step | Description | Risk |
|------|-------------|------|
| 6.1 | Gantt data layer (hooks, utils, date/pixel math) | Medium |
| 6.2 | Gantt static rendering (SVG, header, rows, bars, toolbar) | **High** |
| 6.3 | Gantt interactions (drag-to-move, drag-to-resize) | **High** |
| 6.4 | Dependency arrows (SVG path routing) | **High** |
| 6.5 | Milestone markers on Gantt | Low |
| 6.6 | Gantt page assembly (Today line, filters, zoom) | Medium |

### Phase 7: Frontend - Milestones Page

**Goal**: マイルストーンCRUDと進捗表示

| Step | Description | Risk |
|------|-------------|------|
| 7.1 | Milestones list, form, progress visualization | Low |

### Phase 8: End-to-End Testing and Polish

**Goal**: E2Eテスト、エラーハンドリング、レスポンシブ対応

| Step | Description | Risk |
|------|-------------|------|
| 8.1 | E2E tests (project flow, issue flow, gantt flow) | Medium |
| 8.2 | Error boundaries, loading states, toast notifications | Low |
| 8.3 | Responsive design pass | Low |

### Phase 9: Deployment

**Goal**: Vercel (FE) + Fly.io (BE) への本番デプロイ

| Step | Description | Risk |
|------|-------------|------|
| 9.1 | Backend deployment to Fly.io (fly.toml, managed Postgres) | Medium |
| 9.2 | Frontend deployment to Vercel | Low |
| 9.3 | Environment configuration and documentation | Low |

---

## 5. API Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/users` | List users (`?include_archived=true`) |
| POST | `/users` | Create user |
| GET | `/users/{id}` | Get user |
| PATCH | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Delete user |
| POST | `/users/{id}/archive` | Archive user |
| POST | `/users/{id}/unarchive` | Unarchive user |
| POST | `/users/bulk-delete` | Bulk delete users (max 100) |
| POST | `/users/bulk-archive` | Bulk archive users (max 100) |
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/projects/{id}` | Get project with members |
| PATCH | `/projects/{id}` | Update project |
| DELETE | `/projects/{id}` | Delete project (cascade) |
| POST | `/projects/{id}/archive` | Archive project (cascades to issues) |
| POST | `/projects/{id}/unarchive` | Unarchive project |
| POST | `/projects/bulk-delete` | Bulk delete projects (max 100) |
| POST | `/projects/bulk-archive` | Bulk archive projects (max 100) |
| GET | `/projects/{id}/members` | List members |
| POST | `/projects/{id}/members` | Add member |
| DELETE | `/projects/{id}/members/{uid}` | Remove member |
| POST | `/projects/{id}/members/{uid}/archive` | Archive member |
| POST | `/projects/{id}/members/{uid}/unarchive` | Unarchive member |
| POST | `/projects/{id}/members/bulk-delete` | Bulk delete members (max 100) |
| POST | `/projects/{id}/members/bulk-archive` | Bulk archive members (max 100) |
| GET | `/projects/{id}/issues` | List issues (filterable) |
| POST | `/projects/{id}/issues` | Create issue |
| PATCH | `/projects/{id}/issues/bulk` | Bulk update issues |
| POST | `/projects/{id}/issues/bulk-delete` | Bulk delete issues (max 100) |
| POST | `/projects/{id}/issues/bulk-archive` | Bulk archive issues (max 100) |
| GET | `/issues/{id}` | Get issue detail |
| PATCH | `/issues/{id}` | Update issue |
| DELETE | `/issues/{id}` | Delete issue |
| POST | `/issues/{id}/archive` | Archive issue |
| POST | `/issues/{id}/unarchive` | Unarchive issue |
| GET | `/issues/{id}/comments` | List comments |
| POST | `/issues/{id}/comments` | Create comment |
| PATCH | `/comments/{id}` | Update comment |
| DELETE | `/comments/{id}` | Delete comment |
| POST | `/issues/{id}/attachments` | Upload attachment |
| GET | `/issues/{id}/attachments` | List attachments |
| POST | `/issues/{id}/dependencies` | Add dependency |
| GET | `/issues/{id}/dependencies` | Get issue dependencies |
| DELETE | `/dependencies/{id}` | Remove dependency |
| GET | `/projects/{id}/milestones` | List milestones |
| POST | `/projects/{id}/milestones` | Create milestone |
| PATCH | `/milestones/{id}` | Update milestone |
| DELETE | `/milestones/{id}` | Delete milestone |
| GET | `/projects/{id}/gantt` | Get Gantt chart data |

---

## 6. Risks and Mitigations

### High Risk

| Risk | Phase | Impact | Mitigation |
|------|-------|--------|------------|
| 循環依存検出バグ | Phase 3 | データ破損、無限ループ | トポロジカルソートの網羅的テスト |
| ガントチャートパフォーマンス | Phase 6 | UIフリーズ | 仮想スクロール、SVG最適化、日付範囲制限 |
| ドラッグ操作のスムーズさ | Phase 6 | UX低下 | requestAnimationFrame、楽観的更新 |
| Next.js v16の破壊的変更 | Phase 1 | ビルド失敗 | Context7 MCPで最新ドキュメント確認 |
| SVG矢印ルーティングの重なり | Phase 6 | 視覚的混乱 | オフセットルーティング、表示/非表示トグル |

### Medium Risk

| Risk | Phase | Impact | Mitigation |
|------|-------|--------|------------|
| Issue keyシーケンスのギャップ | Phase 2 | 番号の混乱 | DBシーケンスまたはmax(key)+1 with locking |
| Fly.ioコールドスタート | Phase 9 | 初回リクエスト遅延 | 最小1マシン構成、ヘルスチェックkeep-alive |
| 一括更新の部分的失敗 | Phase 3 | 不整合状態 | 単一トランザクションでall-or-nothing |

---

## 7. Testing Strategy

### Backend (pytest)

| Test File | Coverage Target | What's Tested |
|-----------|----------------|---------------|
| `test_users.py` | 90% | CRUD, validation, duplicate email |
| `test_projects.py` | 90% | CRUD, member management, key uniqueness |
| `test_issues.py` | 90% | CRUD, filtering, sorting, bulk update, key generation |
| `test_milestones.py` | 90% | CRUD, project association |
| `test_dependencies.py` | 95% | Create, delete, circular detection, self-reference |
| `test_gantt.py` | 85% | Data shape, date filtering, empty states |

**Approach**: httpx `AsyncClient` + テストDB。各テストはトランザクション内で実行しロールバック。

### Frontend (Vitest + React Testing Library)

| Test Directory | Coverage Target | What's Tested |
|----------------|----------------|---------------|
| `gantt-utils.test.ts` | 95% | Date/pixel math, edge cases |
| `hooks/` | 85% | Query/mutation behavior, optimistic updates |
| `components/gantt/` | 80% | Bar rendering, row count, positioning |
| `components/issues/` | 80% | Table rendering, form validation |
| `components/projects/` | 80% | Card rendering, form validation |

**Approach**: MSW (Mock Service Worker)でAPIモック。コンポーネントの分離テスト。

### E2E (Playwright)

| Test File | What's Tested |
|-----------|---------------|
| `project-flow.spec.ts` | Create project, edit, delete |
| `issue-flow.spec.ts` | Create issue, change status, filter |
| `gantt-flow.spec.ts` | View Gantt, drag bar, verify date change |

---

## 8. Success Criteria

- [ ] Docker Composeで全3サービスが `docker-compose up` 一発で起動
- [ ] 全バックエンドAPIエンドポイントが正しいレスポンスとステータスコードを返す
- [ ] プロジェクトのCRUDが動作
- [ ] 課題のCRUD、フィルタリング、ソートが動作
- [ ] ガントチャートが日付に基づいて正しい位置にバーを描画
- [ ] ガントバーのドラッグで課題のstart_date/due_dateが更新
- [ ] タスク依存関係がガントチャート上に矢印で表示
- [ ] 循環依存が明確なエラーメッセージで防止
- [ ] マイルストーンがガントチャート上にダイヤモンドマーカーで表示
- [ ] バックエンドテストカバレッジ 80%以上
- [ ] フロントエンドテストカバレッジ 80%以上
- [ ] 全E2Eテストがパス
- [ ] フロントエンドがVercelに正常にデプロイ
- [ ] バックエンドがFly.ioに正常にデプロイ
- [ ] 本番環境でエンドツーエンドの動作確認
