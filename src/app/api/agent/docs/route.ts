import { NextResponse } from 'next/server';

const DOCS = `# Claude Command Center Agent API

## Philosophy

This API is **agent-first**: every endpoint is designed for programmatic consumption by AI agents, CLI tools, and automation scripts. It follows the principles of harness engineering — treating Claude Code sessions as observable systems that can be monitored, analyzed, and improved.

Every response includes a \`_meta\` object with:
- **total** / **returned**: pagination info
- **schema**: link to the JSON Schema for the response type
- **related**: links to related endpoints for easy traversal
- **suggestions**: human-readable hints for next steps

Error responses include:
- **error**: what went wrong
- **code**: machine-readable error code
- **help**: what to do instead
- **docs**: link to the relevant docs section

## Quick Start

**1. List recent sessions:**
\`\`\`bash
curl http://localhost:3000/api/agent/sessions?limit=3
\`\`\`

**2. Trigger a failure analysis:**
\`\`\`bash
curl -X POST http://localhost:3000/api/agent/analyze \\
  -H 'Content-Type: application/json' \\
  -d '{"sessionId":"SESSION_ID","type":"failures"}'
\`\`\`

**3. Get the failures:**
\`\`\`bash
curl 'http://localhost:3000/api/agent/failures?sessionId=SESSION_ID'
\`\`\`

---

## Endpoints

### GET /api/agent
Discovery endpoint. Returns a JSON manifest of all available endpoints, their parameters, return types, and curl examples.

### GET /api/agent/docs
This documentation (markdown).

### GET /api/agent/schemas
Lists all available JSON Schema type names.

### GET /api/agent/schemas/:type
Returns the JSON Schema for a specific type. Valid types: Session, TimelinePlan, Task, Failure, Improvement, HookEvent, AnalysisResult.

---

### GET /api/agent/sessions {#sessions}
List sessions, optionally filtered by status.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| status | string | no | - | Filter: active, completed, error |
| limit | integer | no | 50 | Max results (max 200) |

\`\`\`bash
curl 'http://localhost:3000/api/agent/sessions?status=completed&limit=5'
\`\`\`

---

### GET /api/agent/timeline {#timeline}
Get the reconstructed timeline for a session. Requires a prior timeline analysis.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| sessionId | string | yes | Session ID |
| level | integer | no | Analysis depth (default 0) |

\`\`\`bash
curl 'http://localhost:3000/api/agent/timeline?sessionId=SESSION_ID'
\`\`\`

---

### GET /api/agent/failures {#failures}
Get detected failures for a session. Requires a prior failures analysis.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| sessionId | string | yes | Session ID |
| impact | string | no | Filter: critical, warning, info |
| type | string | no | Filter: tool_failure, api_error, permission_denied, logic_error, timeout |

\`\`\`bash
curl 'http://localhost:3000/api/agent/failures?sessionId=SESSION_ID&impact=critical'
\`\`\`

---

### GET /api/agent/improvements {#improvements}
Get suggested improvements for a session. Requires a prior improvements analysis.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| sessionId | string | yes | Session ID |
| area | string | no | Filter: hooks, skills, subagents, tools, context, architecture, legibility |
| severity | string | no | Filter: high, medium, low |

\`\`\`bash
curl 'http://localhost:3000/api/agent/improvements?sessionId=SESSION_ID&severity=high'
\`\`\`

---

### GET /api/agent/events {#events}
Get raw hook events for a session.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| sessionId | string | yes | - | Session ID |
| type | string | no | - | Filter by event type |
| toolName | string | no | - | Filter by tool name |
| limit | integer | no | 200 | Max results (max 500) |

\`\`\`bash
curl 'http://localhost:3000/api/agent/events?sessionId=SESSION_ID&type=PostToolUse'
\`\`\`

---

### POST /api/agent/analyze {#analyze}
Trigger an analysis job for a session. Returns immediately with a pending status; poll the result.

**Request body (JSON):**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| sessionId | string | yes | - | Session ID to analyze |
| type | string | yes | - | timeline, failures, or improvements |
| level | integer | no | 0 | Analysis depth |

\`\`\`bash
curl -X POST http://localhost:3000/api/agent/analyze \\
  -H 'Content-Type: application/json' \\
  -d '{"sessionId":"SESSION_ID","type":"timeline"}'
\`\`\`

---

### GET /api/agent/analysis/:id {#analysis}
Poll for analysis result by ID.

\`\`\`bash
curl http://localhost:3000/api/agent/analysis/ANALYSIS_ID
\`\`\`

---

## GraphQL

The GraphQL endpoint is at \`/api/agent/graphql\`. It supports all the same data as the REST endpoints.

### Example: List sessions
\`\`\`bash
curl -X POST http://localhost:3000/api/agent/graphql \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"{ sessions(limit:3) { id status startTime totalEvents totalCostUsd } }"}'
\`\`\`

### Example: Get failures with summary
\`\`\`bash
curl -X POST http://localhost:3000/api/agent/graphql \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"{ failures(sessionId:\\"SESSION_ID\\") { type description impact } failureSummary(sessionId:\\"SESSION_ID\\") { total byType { type count } byImpact { impact count } } }"}'
\`\`\`

### Example: Get timeline with tasks
\`\`\`bash
curl -X POST http://localhost:3000/api/agent/graphql \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"{ timeline(sessionId:\\"SESSION_ID\\") { sessionId plans { name phase tasks { name status startTime endTime } } } }"}'
\`\`\`

### Example: Trigger analysis (mutation)
\`\`\`bash
curl -X POST http://localhost:3000/api/agent/graphql \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"mutation { analyze(sessionId:\\"SESSION_ID\\", type:FAILURES) { id status triggeredAt } }"}'
\`\`\`

---

## Common Agent Workflows

### 1. Full Session Review
1. \`GET /api/agent/sessions?status=completed&limit=1\` — get the latest session
2. \`POST /api/agent/analyze\` with type=timeline — trigger timeline analysis
3. \`POST /api/agent/analyze\` with type=failures — trigger failure detection
4. \`POST /api/agent/analyze\` with type=improvements — trigger improvement suggestions
5. Poll each analysis with \`GET /api/agent/analysis/:id\`
6. \`GET /api/agent/timeline?sessionId=...\` — view the timeline
7. \`GET /api/agent/failures?sessionId=...\` — review failures
8. \`GET /api/agent/improvements?sessionId=...\` — review suggestions

### 2. Quick Health Check
\`\`\`bash
curl -s http://localhost:3000/api/agent/sessions?limit=5 | jq '.data[] | {id, status, totalEvents}'
\`\`\`

### 3. Critical Failure Alert
\`\`\`bash
curl -s 'http://localhost:3000/api/agent/failures?sessionId=SESSION_ID&impact=critical' | jq '.data'
\`\`\`

### 4. Improvement Triage
\`\`\`bash
curl -s 'http://localhost:3000/api/agent/improvements?sessionId=SESSION_ID&severity=high' | jq '.data[] | {area, problem, suggestion}'
\`\`\`
`;

export async function GET() {
  return new NextResponse(DOCS, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
