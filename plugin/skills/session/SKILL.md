---
description: "Inspect the current Claude Code session — view events, status, cost, and raw data captured by daemon"
argument-hint: "[sessionId]"
---

# Session Inspector

Inspect a Claude Code session's captured data — events, metadata, and raw hook payloads.

## Find Sessions

```bash
# List all sessions
curl -s localhost:3000/api/agent/sessions | jq '.data[] | {id: .id, status: .status, events: .totalEvents, cost: .totalCostUsd, cwd: .cwd}'

# Active sessions only
curl -s localhost:3000/api/agent/sessions?status=active | jq '.data'

# Most recent session
curl -s localhost:3000/api/agent/sessions?limit=1 | jq '.data[0]'
```

Use `$ARGUMENTS` if a session ID was provided.

## View Session Events

```bash
SESSION_ID="<id>"

# Recent events (last 20)
curl -s "localhost:3000/api/agent/events?sessionId=$SESSION_ID&limit=20" | jq '.data[] | {type: .eventType, tool: .toolName, success: .success, ts: .timestamp}'

# Filter by event type
curl -s "localhost:3000/api/agent/events?sessionId=$SESSION_ID&type=PostToolUse" | jq '.data'

# Filter by tool name
curl -s "localhost:3000/api/agent/events?sessionId=$SESSION_ID&toolName=Bash" | jq '.data'
```

## Session Metadata

```bash
# Full session detail with events
curl -s "localhost:3000/api/sessions/$SESSION_ID" | jq '.session'
```

## Rename or Group Sessions

```bash
# Rename a session
curl -s -X PATCH "localhost:3000/api/sessions/$SESSION_ID" \
  -H 'Content-Type: application/json' \
  -d '{"name": "My Session Name"}'

# Assign to a group
curl -s -X PATCH "localhost:3000/api/sessions/$SESSION_ID" \
  -H 'Content-Type: application/json' \
  -d '{"groupLabel": "feature-work"}'
```

## Send a Message to a Session

```bash
curl -s -X POST "localhost:3000/api/sessions/$SESSION_ID/message" \
  -H 'Content-Type: application/json' \
  -d '{"message": "What is the status of this session?"}'
```

## GraphQL Queries

For complex queries across sessions:

```bash
# Sessions with most events
curl -s -X POST localhost:3000/api/agent/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query": "{ sessions(limit: 5) { id name status totalEvents totalCostUsd startTime } }"}'

# Events for a session with specific tool
curl -s -X POST localhost:3000/api/agent/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query": "{ events(sessionId: \"SESSION_ID\", toolName: \"Bash\") { id eventType toolName success timestamp } }"}'
```

## Important

- Daemon must be running at `localhost:3000`
- The UI at `localhost:3000` shows all this data visually
- Use `/daemon:analyze` to trigger analysis on a session
- Use `/daemon:harness` to get improvement suggestions
