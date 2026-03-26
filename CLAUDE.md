# Daemon

## Architecture

### Backend: DDD (Domain-Driven Design)
- `src/server/domain/` — Pure entities and repository interfaces. NO infrastructure imports (no sqlite, no fs, no child_process)
- `src/server/application/` — Use cases that orchestrate domain + infrastructure
- `src/server/infrastructure/` — Implementations (SQLite repos, Agent SDK runner, GraphQL)

### Frontend: FSD (Feature-Sliced Design)
Strict layer dependencies (lower layers cannot import higher):
- `src/shared/` → base layer (UI primitives, utils, hooks) — cannot import from entities/features/app
- `src/entities/` → entity models and display components — cannot import from features/app
- `src/features/` → feature slices (timeline, failures, improvements, session, harness) — cannot import from app
- `src/app/` → Next.js pages — composes features

### Rules
- All TypeScript, strict mode, no `any` types, no type assertions unless justified with comment
- Every new function/component MUST have a corresponding `.test.ts` file
- Use Vitest for unit tests, Playwright for e2e
- Test files live next to source: `foo.ts` → `foo.test.ts`
- Biome handles linting + formatting — no manual formatting
- No barrel exports (index.ts re-exports) — import directly from source files
- Prefer composition over inheritance
- Use `satisfies` over `as` for type narrowing
- Server components by default, `'use client'` only when needed
- Use agent teams for parallel work when tasks are independent

### API Routes
Frontend components must use the correct API paths:
- Event ingestion: `POST /api/events`
- Sessions list: `GET /api/sessions`
- Session detail: `GET /api/sessions/[id]`
- Session update: `PATCH /api/sessions/[id]`
- Analysis trigger: `POST /api/agent/analyze`
- Analysis poll: `GET /api/agent/analysis/[id]`
- Analysis submit: `POST /api/agent/analysis/[id]/submit`
- Analysis fetch: `GET /api/analysis?type=X&sessionId=Y`
- Agent sessions: `GET /api/agent/sessions`
- Agent timeline: `GET /api/agent/timeline?sessionId=X`
- Agent failures: `GET /api/agent/failures?sessionId=X`
- Agent improvements: `GET /api/agent/improvements?sessionId=X`
- Groups: `GET /api/groups`
- Schemas: `GET /api/agent/schemas/[type]`
- Docs: `GET /api/agent/docs`
- GraphQL: `POST /api/agent/graphql`
