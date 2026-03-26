---
description: "Analyze the current Claude Code session — trigger timeline, failure detection, and improvement analysis via daemon, then explore results at different matryoshka depth levels"
argument-hint: "[sessionId] [type]"
---

# Analyze Session

Trigger and explore analysis of a Claude Code session. Daemon runs the analysis using the Claude Agent SDK and returns structured results.

## Step 1: Find the Current Session

```bash
curl -s localhost:3000/api/agent/sessions?status=active | jq '.data[0].id' -r
```

If no active session, use the most recent:

```bash
curl -s localhost:3000/api/agent/sessions?limit=1 | jq '.data[0].id' -r
```

Use `$ARGUMENTS` if a session ID was provided.

## Step 2: Run Analysis

Trigger all three analysis types for the session:

```bash
SESSION_ID="<id from step 1>"

# Timeline — what happened, structured as plans and tasks
curl -s -X POST localhost:3000/api/agent/analyze \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"$SESSION_ID\",\"type\":\"timeline\"}"

# Failures — what went wrong
curl -s -X POST localhost:3000/api/agent/analyze \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"$SESSION_ID\",\"type\":\"failures\"}"

# Improvements — how to make the harness better
curl -s -X POST localhost:3000/api/agent/analyze \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"$SESSION_ID\",\"type\":\"improvements\"}"
```

Each call runs the Claude Agent SDK to analyze session events. Results are returned when complete (may take 1-2 minutes per type).

## Step 3: View Results

### Timeline (Events level — matryoshka level 0)
```bash
curl -s "localhost:3000/api/agent/timeline?sessionId=$SESSION_ID" | jq '.data'
```

### Failures
```bash
curl -s "localhost:3000/api/agent/failures?sessionId=$SESSION_ID" | jq '.data'
```

### Improvements
```bash
curl -s "localhost:3000/api/agent/improvements?sessionId=$SESSION_ID" | jq '.data'
```

## Step 4: Explore Deeper — Matryoshka Levels

The timeline supports 3 depth levels, each synthesizing the previous:

- **Level 0 (Events)**: Raw events grouped into plans and tasks
- **Level 1 (Phases)**: Plans grouped into phases and milestones
- **Level 2 (Narrative)**: The big picture — session narrative

Build higher levels:

```bash
# Build Phases from Events
curl -s -X POST localhost:3000/api/agent/analyze \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"$SESSION_ID\",\"type\":\"timeline\",\"level\":1}"

# Build Narrative from Phases
curl -s -X POST localhost:3000/api/agent/analyze \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"$SESSION_ID\",\"type\":\"timeline\",\"level\":2}"
```

Query a specific level:
```bash
curl -s "localhost:3000/api/agent/timeline?sessionId=$SESSION_ID&level=1" | jq '.data'
curl -s "localhost:3000/api/agent/timeline?sessionId=$SESSION_ID&level=2" | jq '.data'
```

## Step 5: Present Results

Summarize the session analysis:

1. **Timeline**: What was accomplished, in what order, which phases
2. **Failures**: What went wrong, root causes, impact severity
3. **Improvements**: What could be better, categorized by area, with effort estimates

For failures with evidence, show the relevant event IDs.
For improvements with configs, show the ready-to-use JSON.

## Important

- Daemon must be running at `localhost:3000`
- Analysis uses the Claude Agent SDK — auth is resolved automatically from your subscription or ANTHROPIC_API_KEY
- Higher matryoshka levels build on lower ones — run level 0 before level 1, level 1 before level 2
- The UI at `localhost:3000` shows these same results visually
