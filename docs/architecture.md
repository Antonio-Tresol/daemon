# Architecture

Daemon is a Next.js application with a Domain-Driven Design backend and Feature-Sliced Design frontend. This document describes how the pieces fit together.

---

## System overview

```
Claude Code Agent
       │
       ├── HTTP hooks ──────→ POST /api/events ──→ IngestEventUseCase ──→ SQLite
       │                                                                      │
       └── OpenTelemetry ───→ POST /api/otel ────→ OtelReceiver ────────→ SQLite
                                                                              │
                                                               ┌──────────────┤
                                                               │              │
                                                               ▼              ▼
                                                           Sessions       Events
                                                               │              │
                                                               └──────┬───────┘
                                                                      │
                                                                      ▼
                                                         POST /api/agent/analyze
                                                                      │
                                                                      ▼
                                                         RunAnalysisUseCase
                                                                      │
                                                                      ▼
                                                         ClaudeRunner (Agent SDK)
                                                                      │
                                                                      ▼
                                                         Analysis results ──→ SQLite
                                                                                 │
                                                                                 ▼
                                                                   Frontend (Next.js)
                                                         Timeline │ Failures │ Improvements
```

Events flow in through two channels: **HTTP hooks** (the primary path via `POST /api/events`) and **OpenTelemetry** (OTLP/HTTP JSON via `POST /api/otel`). Both paths store events in SQLite alongside session metadata. When a user or agent triggers analysis, daemon uses the Anthropic Agent SDK to process the event stream and produce structured results. The frontend queries these results through API routes and renders them at multiple levels of detail.

---

## Backend: Domain-Driven Design

The backend follows a strict three-layer architecture where dependencies point inward: infrastructure depends on domain, application depends on domain, but domain depends on nothing.

### Domain layer

```
src/server/domain/
  event/
    event.entity.ts          HookEvent type, EventType union
    event.repository.ts       EventRepository interface
  session/
    session.entity.ts         Session type, SessionStatus union
    session.repository.ts     SessionRepository interface
  analysis/
    analysis.entity.ts        AnalysisResult, Failure, Improvement types
    analysis.repository.ts    AnalysisRepository interface
  claude/
    claude-runner.port.ts     ClaudeRunnerPort interface, SendMessageResult
```

The domain layer is pure TypeScript types and interfaces. It contains no infrastructure imports (no sqlite, no fs, no child_process, no node: modules). This is enforced by convention and verified during code review.

**Key entities:**

A `HookEvent` represents a single action the agent took: a tool call, a session lifecycle event, a subagent operation, or an API interaction. Events are identified by type (PostToolUse, SessionStart, api_error, etc.), linked to a session, and carry an arbitrary payload.

A `Session` represents a single Claude Code session from start to finish. It tracks status (active, completed, error), start/end times, working directory, project hash, event count, cumulative cost in USD, and optional human-assigned name and group label.

An `AnalysisResult` represents the output of running a Claude agent over a session's events. It contains the analysis type (timeline, failures, improvements), a depth level, status (pending, running, completed, failed), the structured result, timestamps for when it was triggered and completed, and an optional error message.

**Repository interfaces** define the contract for data access without specifying how data is stored:

- `EventRepository` — save, find by session/time/type, count
- `SessionRepository` — save, update, find by id/group/status, manage names and groups
- `AnalysisRepository` — save, update, find by id/session/type/level, find by session+type+level combination

**Ports** define contracts for external capabilities:

- `ClaudeRunnerPort` — send messages to Claude, run analysis over session data

### Application layer

```
src/server/application/
  ingest-event.use-case.ts    IngestEventUseCase
  run-analysis.use-case.ts    RunAnalysisUseCase
  send-message.use-case.ts    SendMessageUseCase
```

Use cases orchestrate domain logic. They accept repository and port interfaces via constructor injection and coordinate operations across multiple domain entities.

`IngestEventUseCase` is the most frequently called use case. It receives raw event input from the HTTP hook endpoint, normalises it into a `HookEvent`, saves it to the event repository, and ensures a corresponding session exists (creating one if this is the first event for that session ID). It also updates session status based on event type: `SessionEnd` and `Stop` events mark the session as completed, `api_error` events mark it as errored.

`RunAnalysisUseCase` coordinates analysis jobs. It creates an analysis record, loads events for the session, delegates to the `ClaudeRunnerPort` for processing, and saves the result. If analysis fails, it captures the error.

`SendMessageUseCase` sends messages to a Claude session via the `ClaudeRunnerPort`. Used for interactive communication from the session console.

### Infrastructure layer

```
src/server/infrastructure/
  db/
    sqlite.ts                  Database singleton, auto-initialisation, migrations
    schema.ts                  SQL table definitions
    drizzle-schema.ts          Drizzle ORM schema definitions
    event.sqlite-repo.ts       EventRepository implementation
    session.sqlite-repo.ts     SessionRepository implementation
    analysis.sqlite-repo.ts    AnalysisRepository implementation
  agent-sdk-claude-runner.ts   ClaudeRunnerPort implementation (uses @anthropic-ai/claude-agent-sdk)
  claude-auth.ts               SDK authentication (API key / OAuth token)
  create-claude-runner.ts      Factory for creating Claude runner instances
  analysis-schemas.ts          JSON schemas for structured analysis outputs
  entity-schemas.ts            JSON schemas for domain entity types
  load-prompt.ts               Loads prompt templates from src/prompts/
  parse-analysis-result.ts     Parses and validates analysis JSON responses
  otel-receiver.ts             OTLP/HTTP log receiver, converts OpenTelemetry logs to HookEvents
  graphql/
    schema.ts                  GraphQL type definitions
    resolvers.ts               GraphQL query resolvers
  build-event-summary.ts       Builds event summaries for analysis prompts
  run-agent-analysis.ts        Orchestrates Agent SDK for analysis
  auto-name-session.ts         Auto-names sessions after timeline analysis
```

Infrastructure implements domain interfaces using concrete technology:

**SQLite** (via better-sqlite3) is the storage engine. The database auto-initialises on first access, creating tables and running migrations. It uses a singleton pattern — one connection shared across the application. All queries use parameterised statements (no string concatenation).

**ClaudeRunner** implements `ClaudeRunnerPort` using the `@anthropic-ai/claude-agent-sdk`. For analysis, it loads a prompt template from `src/prompts/`, injects session event data, and passes it to Claude. The response is parsed and returned as structured data.

**OtelReceiver** (`otel-receiver.ts`) parses OTLP/HTTP JSON payloads, converting OpenTelemetry log records into `HookEvent` objects and extracting metrics into a dedicated format. This provides an alternative ingestion path alongside HTTP hooks.

**GraphQL** provides an alternative query interface for complex data access patterns. The schema mirrors the domain entities, and resolvers query the SQLite repositories directly.

---

## Frontend: Feature-Sliced Design

The frontend follows a strict layered architecture where each layer can only import from layers below it.

```
src/app/          ← Pages, composes features          (can import everything)
src/features/     ← Feature slices                     (can import entities, shared)
src/entities/     ← Entity models, display components  (can import shared)
src/shared/       ← UI primitives, utilities, hooks    (can import nothing above)
```

### Shared layer

```
src/shared/
  ui/
    Badge.tsx              Styled badge (two variants: neutral, ember)
    Card.tsx               Depth-1 card with optional accent border
    EditableText.tsx       Inline-editable text field
    EmptyState.tsx         Centered empty state with optional icon
    ErrorState.tsx         Ember-bordered error message
    GroupFilter.tsx        Session group filter dropdown
    Header.tsx             Page header with breadcrumbs
    LatentDivergence.tsx   Generative SVG background animation
    LoadingState.tsx       Centered loading spinner
    Sidebar.tsx            Navigation sidebar with session indicator
    StatusIndicator.tsx    Symbol-based status (checkmark, cross, diamond, circle)
  hooks/
    use-websocket.ts       WebSocket connection with auto-reconnect
  lib/
    format.ts              Date/time/duration formatting
    parse-json.ts          Multi-strategy JSON extraction from Claude output
    severity-symbols.ts    Impact and severity symbol mapping
```

The shared layer has zero imports from entities, features, or app. All components use the three-colour design system (void, bone, ember) and symbol-based status indicators.

### Entities layer

```
src/entities/
  analysis/
    model.ts                 AnalysisResult, Failure, Improvement types (frontend)
    analysis-types.ts        Central type registry (ANALYSIS_TYPES, PROMPT_FILES)
    api/
      fetch-analysis.ts      Generic analysis fetcher
    ui/
      AnalysisBadge.tsx      Analysis status badge
  event/
    model.ts                 HookEvent type (frontend)
    ui/
      EventBadge.tsx         Event type badge
  session/
    model.ts                 Session type (frontend)
    ui/
      SessionCard.tsx        Session summary card
```

The central type registry (`analysis-types.ts`) is the single source of truth for analysis types. Both frontend and backend import from it. Adding a new analysis type means updating this one file.

### Features layer

```
src/features/
  timeline/                  Session timeline exploration
    api/                       Query functions
    hooks/                     useMatchedEvents hook
    model/                     useTimeline hook
    ui/                        TimelineView, TrajectoryView, PlanCard,
                               TaskIcon, StatusSymbol, PlanGroup, TaskGroup,
                               TimelineEvent
  failures/                  Failure analysis
    api/                       Query functions
    model/                     useFailures hook
    ui/                        FailureTimeline, FailureCard
  improvements/              Improvement recommendations
    api/                       Query functions
    model/                     useImprovements hook
    ui/                        ImprovementsList, ImprovementCard
  session/                   Session management
    api/                       Query functions
    model/                     useSession hook
    ui/                        SessionList, SessionConsole, SessionOverview,
                               AnalyzeButton
  harness/                   Analysis harness
    ui/                        HarnessContent (analysis trigger UI)
```

Each feature follows the same structure: API queries, model hooks, and UI components. Features import from entities and shared but never from other features or app.

### App layer

```
src/app/
  page.tsx                   Dashboard (redirects to timeline)
  layout.tsx                 Root layout with sidebar
  dashboard-content.tsx      Client-side dashboard component
  timeline/
    page.tsx                 Timeline page
    timeline-content.tsx     Client-side timeline component
  failures/                  Failures page
  improvements/              Improvements page
  sessions/                  Sessions list page
  session/[id]/
    page.tsx                 Session detail page
    session-detail-content.tsx  Client-side session detail component
  setup/                     Setup instructions page
  api/
    agent/_lib/response.ts   Shared agent API response helpers
    ...                      API routes (see below)
```

---

## API surface

### Ingestion endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/events` | Receives HTTP hook events from Claude Code |
| `POST /api/otel` | Receives OTLP/HTTP JSON logs and metrics from OpenTelemetry |

### Agent API

All endpoints under `/api/agent/` are designed for programmatic access by agents and tools:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agent` | GET | Discovery: lists all available endpoints with documentation |
| `/api/agent/sessions` | GET | List sessions with filters (status, limit, group) |
| `/api/agent/sessions/:id` | GET/PATCH | Get or update a session |
| `/api/agent/events` | GET | Get events for a session (with type, tool, limit filters) |
| `/api/agent/timeline` | GET | Get timeline analysis results |
| `/api/agent/failures` | GET | Get failure analysis results |
| `/api/agent/improvements` | GET | Get improvement recommendations |
| `/api/agent/analyze` | POST | Trigger a new analysis (timeline, failures, improvements) |
| `/api/agent/analysis/:id` | GET | Poll analysis status and results |
| `/api/agent/analysis/:id/submit` | POST | Submit manual analysis results |
| `/api/agent/groups` | GET | List session groups |
| `/api/agent/graphql` | POST | GraphQL endpoint for complex queries |
| `/api/agent/schemas` | GET | List available JSON schemas |
| `/api/agent/schemas/:type` | GET | Get JSON schema for a specific type |
| `/api/agent/docs` | GET | API documentation |

### Frontend API

Endpoints under `/api/` (without `/agent/`) serve the frontend directly:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sessions` | GET | Session list |
| `/api/sessions/:id` | GET/PATCH | Get or update a session |
| `/api/sessions/:id/message` | POST | Send message to active session |
| `/api/events` | GET | Event list with pagination |
| `/api/groups` | GET | Session groups |
| `/api/analysis` | POST | Trigger analysis (frontend flow) |
| `/api/analysis/:id` | GET | Poll analysis status and results |

---

## Data flow

### Event ingestion

Two ingestion paths feed events into the same storage:

**HTTP hooks (primary):**
```
Claude Code hook fires
  → POST /api/events (JSON body with session_id, event_type, tool_name, etc.)
    → Parse and normalise event fields
    → IngestEventUseCase.execute()
      → EventRepository.save(event)
      → SessionRepository.findById(sessionId)
        → If no session: create new session with status 'active'
        → If session exists: update event count, check for lifecycle events
```

**OpenTelemetry:**
```
OTLP/HTTP JSON export
  → POST /api/otel (OTLP logs or metrics payload)
    → Parse resourceLogs: extract session.id, event.name, tool_name from attributes
      → Convert to HookEvent format → insert into events table
    → Parse resourceMetrics: extract metric name, value, timestamps
      → Insert into otel_metrics table
```

### Analysis

```
User clicks "Analyse" (or POST /api/agent/analyze)
  → Create AnalysisResult record (status: 'pending')
  → Load all events for session from EventRepository
  → Build event summary (buildEventSummarySync)
  → Build analysis prompt (readPromptTemplate + inject event data)
  → Trigger Anthropic API via SDK (runClaudeAgent)
    → Claude processes events, returns structured JSON
  → Parse result (extractJson)
  → Save result to AnalysisRepository (status: 'completed')
  → If timeline analysis: auto-name session based on content
```

### Frontend rendering

```
User navigates to Timeline page
  → useTimeline hook calls fetchAnalysis('timeline', sessionId)
    → GET /api/agent/timeline?sessionId=X
      → AnalysisRepository.findLatestByType(sessionId, 'timeline')
      → Return structured result (phases, tasks, narrative)
  → TimelineView renders phases at selected depth
    → TrajectoryView for plan-based view
    → PlanCard/TaskGroup/TaskIcon for drill-down
    → useMatchedEvents hook fetches events for selected plan
```

---

## Key design decisions

### SQLite over Postgres

Daemon uses SQLite because it eliminates deployment complexity. There's no database server to configure, no connection strings, no migrations to run manually. The database file auto-creates on first request. This matters because daemon should be as easy to set up as `npm install && npm run dev`. For the expected workload (hundreds to thousands of events per session, tens of sessions), SQLite is more than sufficient.

### Anthropic SDK over Claude CLI

Analysis is performed using the official `@anthropic-ai/claude-agent-sdk` instead of spawning the `claude` CLI child process. This provides cleaner structured data extraction and avoids child process management overhead, though it requires an ANTHROPIC_API_KEY.

### Central type registry

Analysis types (timeline, failures, improvements) are defined in a single file (`analysis-types.ts`) that both frontend and backend import. Adding a new analysis type means updating one array and one prompt-file mapping. The `AnalysisType` type is derived from the array using `as const` and indexed access, so TypeScript enforces completeness everywhere the type is used.

### Multi-resolution analysis

Timeline analysis produces a nested structure: narrative at the top, phases in the middle, individual events at the bottom. This is stored as a single JSON result but queried at different levels. The frontend selects the depth to render based on user interaction, implementing the progressive disclosure principle from harness engineering.

### Symbol-based design

The entire UI uses three colours (void, bone, ember) and communicates status through typographic symbols rather than colour coding. This is an accessibility decision, a design constraint that produces visual cohesion, and a practical choice: symbols are unambiguous in both light and dark themes.

---

## File statistics

```
Backend:     29 files (domain: 7, application: 3, infrastructure: 19)
Frontend:    84 files (shared: 15, entities: 8, features: 26, app: 35)
Total:       113 TypeScript files
```

All TypeScript with strict mode enabled. No `any` types (enforced by Biome). No barrel exports. Every type assertion justified with a comment.
