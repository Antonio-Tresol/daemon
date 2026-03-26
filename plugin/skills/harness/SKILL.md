---
description: "Query daemon for harness engineering improvements, failures, and timeline — then apply them to improve the codebase for agents"
---

# Harness Engineering

You are performing a harness engineering review. Daemon is running at `localhost:3000` and has been monitoring Claude Code sessions — capturing events, analyzing failures, and generating improvement suggestions.

Your job is to query the daemon API, understand what's working and what's not, and make concrete improvements to the codebase's agent harness.

## Step 1: Discover Sessions

Find the most recent or active session:

```bash
curl -s localhost:3000/api/agent/sessions?status=active | jq '.data[0]'
```

If no active sessions, get the most recent:

```bash
curl -s localhost:3000/api/agent/sessions?limit=1 | jq '.data[0]'
```

Save the `id` field — you'll need it for all subsequent queries.

## Step 2: Get Harness Improvements

Query the improvement suggestions:

```bash
curl -s "localhost:3000/api/agent/improvements?sessionId=SESSION_ID" | jq '.data'
```

These are categorized by area:
- **hooks** — Pre/post tool hooks for enforcement, auto-formatting, blocking dangerous patterns
- **skills** — Custom slash commands for repeatable workflows
- **subagents** — Agent teams for parallel work, specialized roles
- **tools** — MCP servers, custom tools, observability integrations
- **context** — CLAUDE.md, docs/, design docs, architecture maps
- **architecture** — Layer boundaries, dependency rules, naming conventions
- **legibility** — Structured logging, error messages with remediation, self-documenting APIs

## Step 3: Get Failures

Query the detected failures:

```bash
curl -s "localhost:3000/api/agent/failures?sessionId=SESSION_ID" | jq '.data'
```

Look for patterns: repeated failure types, specific tools that fail often, permission issues.

## Step 4: Present Findings

Summarize what you found, grouped by category:

1. **Critical** (severity: high) — Address these first
2. **Friction** (severity: medium) — These slow agents down
3. **Nice-to-have** (severity: low) — Polish items

For each suggestion that has a `config` field, show the ready-to-use configuration.

## Step 5: Apply Improvements

For each suggestion, offer to implement it:

- **Hook suggestions**: Add to `.claude/settings.json` under the appropriate hook event
- **Skill suggestions**: Create a new `.claude/skills/<name>/SKILL.md` file
- **Context suggestions**: Update `CLAUDE.md` or create docs in `docs/`
- **Architecture suggestions**: Add lints, structural tests, or hook enforcement
- **Subagent suggestions**: Update `CLAUDE.md` with team strategy guidance
- **Tool suggestions**: Add MCP server configuration or create utility scripts

Always ask the user before applying changes. Show what you'll change and get confirmation.

## Step 6: Verify

After applying improvements, verify they work:
- For hooks: trigger the relevant tool use and check the hook fires
- For skills: run the skill with `/skillname`
- For context: read the file and verify it's correct
- For architecture: run `npx tsc --noEmit` and linters

## Advanced: GraphQL Queries

For complex queries, use the GraphQL endpoint:

```bash
curl -s -X POST localhost:3000/api/agent/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query": "{ improvements(sessionId: \"SESSION_ID\", severity: HIGH) { area problem suggestion config effort } }"}'
```

## Important

- Daemon must be running at `localhost:3000` for this skill to work
- If the API returns errors, check if the server is running: `curl -s localhost:3000/api/agent | jq`
- Prioritize high-severity improvements with trivial/small effort first — maximum impact, minimum cost
- Always preserve existing hooks when adding new ones — merge, don't replace
