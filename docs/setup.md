# Setting up daemon

This guide covers getting daemon running and connecting it to your Claude Code agents. It works for both humans setting up their development environment and agents configuring a new codebase.

---

## Prerequisites

- Node.js 22+
- SDK auth: `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` environment variable set
- Port 3000 available (default)

---

## Quick start

```bash
git clone https://github.com/Antonio-Tresol/daemon.git && cd daemon
npm install
npm run dev
```

Daemon is now running at `http://localhost:3000`. No database setup needed — SQLite initialises automatically on first request.

---

## Connecting Claude Code

Daemon receives events from Claude Code through HTTP hooks and OpenTelemetry. Both need to be configured once.

### Automated setup (recommended)

From the daemon directory:

```bash
bash scripts/onboard.sh
```

This installs HTTP hooks into `~/.claude/settings.json`, exports OpenTelemetry environment variables, and verifies the server is reachable. Restart Claude Code after running it.

### Manual setup

If you prefer to configure things yourself, or the onboard script doesn't work for your environment:

#### HTTP hooks

Add these to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "", "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "SessionEnd": [
      { "matcher": "", "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "PostToolUse": [
      { "matcher": "", "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "PostToolUseFailure": [
      { "matcher": "", "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "Stop": [
      { "matcher": "", "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "SubagentStart": [
      { "matcher": "", "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "SubagentStop": [
      { "matcher": "", "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "Notification": [
      { "matcher": "", "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ]
  }
}
```

Every hook event type points to the same endpoint. Daemon disambiguates by reading the event payload.

#### OpenTelemetry

Export these environment variables before starting Claude Code:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:3000/api/otel
export OTEL_LOG_USER_PROMPTS=1
export OTEL_LOG_TOOL_DETAILS=1
export OTEL_METRIC_EXPORT_INTERVAL=10000
export OTEL_LOGS_EXPORT_INTERVAL=5000
```

Or source the setup script: `source scripts/setup-otel.sh`

#### Verify

```bash
bash scripts/verify-setup.sh
```

Checks that hooks are installed, environment variables are set, and the server is reachable.

---

## Running on a different host

If daemon runs on a machine other than localhost, set the URL before running setup:

```bash
export DAEMON_URL=http://192.168.1.100:3000
bash scripts/onboard.sh
```

The WebSocket URL is derived automatically from the browser's location, so no additional configuration is needed for the frontend.

---

## Docker

```bash
docker-compose up --build
```

This builds the production image (multi-stage, Node.js 22 slim) and runs daemon on port 3000 with a persistent volume for the SQLite database at `/app/data`.

---

## What happens after setup

Once Claude Code is connected, events flow into daemon in real time. Open `http://localhost:3000` and you'll see:

1. **Sessions** appearing in the sidebar as Claude Code starts working
2. **Events** streaming in as the agent makes tool calls
3. **Timeline** view showing the session structure after you trigger a timeline analysis
4. **Failures** and **Improvements** available after running those analyses

### Triggering analysis

Navigate to the **Harness** page in daemon's UI, select a session, and run timeline, failure, or improvement analysis. Each analysis spawns a Claude agent that processes the session's events and produces structured results.

You can also trigger analysis programmatically:

```bash
curl -X POST http://localhost:3000/api/agent/analyze \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","type":"timeline"}'
```

---

## Agent API

Daemon exposes an API designed for agents to query programmatically. Hit the discovery endpoint to see everything available:

```bash
curl http://localhost:3000/api/agent
```

Key endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agent/sessions` | GET | List sessions with filters |
| `/api/agent/sessions/:id` | GET | Get a single session by ID |
| `/api/agent/events?sessionId=X` | GET | Get events for a session |
| `/api/agent/timeline?sessionId=X` | GET | Get timeline analysis results |
| `/api/agent/failures?sessionId=X` | GET | Get failure analysis results |
| `/api/agent/improvements?sessionId=X` | GET | Get improvement recommendations |
| `/api/agent/groups` | GET | List all session group labels |
| `/api/agent/analyze` | POST | Trigger a new analysis |
| `/api/agent/analysis/:id` | GET | Poll analysis status and results |
| `/api/agent/analysis/:id/submit` | POST | Submit analysis results |
| `/api/agent/graphql` | GET/POST | GraphQL endpoint for complex queries |
| `/api/agent/schemas` | GET | List available schema type names |
| `/api/agent/schemas/:type` | GET | JSON schema for a specific data type |
| `/api/agent/docs` | GET | Full markdown API documentation |

### GraphQL

For complex queries, use the GraphQL endpoint:

```bash
curl -X POST http://localhost:3000/api/agent/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ sessions(limit:5) { id status startTime totalEvents name } }"}'
```

---

## Database

SQLite, stored at `./data/daemon.db`. Auto-creates on first run. Schema includes four tables:

- **sessions** — agent session metadata (id, timestamps, status, working directory, name, event count, cost)
- **events** — every hook event (tool calls, errors, session lifecycle)
- **analyses** — analysis jobs and their results (timeline, failures, improvements)
- **otel_metrics** — OpenTelemetry metrics (token usage, latency, etc.)

To reset: delete `data/daemon.db` and restart daemon.

---

## Uninstalling

```bash
bash scripts/uninstall-hooks.sh
```

Removes only the daemon HTTP hooks from `~/.claude/settings.json`, preserving everything else. Creates a backup at `~/.claude/settings.json.pre-uninstall`.

---

## Troubleshooting

**No events appearing:** Check that daemon is running (`curl localhost:3000/api/agent`), hooks are installed (`grep api/events ~/.claude/settings.json`), and Claude Code was restarted after setup.

**Analysis stays pending:** Verify your `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` environment variable is set. Daemon uses the Anthropic API to process events and requires authentication.

**Database locked:** Stop all daemon instances, delete `data/daemon.db`, and restart. The schema recreates automatically.

**Windows PATH issues:** Prefix commands with `export PATH="/c/Program Files/nodejs:$HOME/AppData/Roaming/npm:$PATH"` if node/npm aren't found.

---

## Scripts reference

| Script | Purpose |
|--------|---------|
| `scripts/onboard.sh` | Full setup: hooks + OTel + verify |
| `scripts/setup-hooks.sh` | Install HTTP hooks only |
| `scripts/setup-otel.sh` | Export OTel environment variables |
| `scripts/verify-setup.sh` | Verify all components configured |
| `scripts/uninstall-hooks.sh` | Remove daemon hooks (preserves others) |

All scripts are idempotent — safe to run multiple times.
