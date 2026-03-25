# daemon

**A proof-of-concept monitoring system for long-running [Claude Code](https://docs.anthropic.com/en/docs/claude-code) agents.**

When codebases become optimised harness-engineered systems, agents run for hours across multiple context compaction horizons. They make thousands of tool calls, hit failures they silently recover from, and leave behind sessions that no human has time to read end-to-end. Daemon exists because someone needs to watch the watchers.

> This is a proof of concept exploring what agent session monitoring could look like. It currently monitors **Claude Code** sessions exclusively, using Claude Code's HTTP hooks and OpenTelemetry telemetry as its data sources.

---

## The problem

Harness engineering is redefining how software gets built. Teams at OpenAI, Anthropic, and across the industry are shipping codebases where humans steer and agents execute. Ryan Lopopolo's team at OpenAI built a million-line product with zero manually-written code. Anthropic's Discovery team ran Claude for days to build a differentiable cosmological solver. These aren't demos. These are production systems where agents work autonomously for hours, sometimes while their operators sleep.

But autonomy creates a visibility gap.

A single Claude Code session can span hundreds of tool calls, multiple context compactions, and several hours of wall-clock time. When something goes wrong, you get a failed PR or a broken feature. When something goes subtly wrong, you get nothing at all, just a session that looks fine on the surface but made poor architectural decisions, repeated work across compaction boundaries, or silently swallowed errors that will compound later.

The longer agents run, the harder it is to answer basic questions:
- What did the agent actually do during that six-hour session?
- Where did it fail, and what evidence exists in the session?
- What patterns keep recurring across sessions?
- How can the harness be improved to prevent these failures?

Daemon answers these questions.

---

## What daemon does

Daemon ingests events from Claude Code sessions via HTTP hooks and OpenTelemetry, then provides a structured interface for exploring what happened at whatever level of depth you need.

### Multi-resolution exploration

Not every question requires reading every event. Daemon provides three levels of depth for understanding a session:

- **Events** show every tool call, every decision, every error, as it happened. This is the raw timeline, useful for debugging a specific failure or understanding exactly how the agent approached a problem.

- **Phases** group events into coherent units of work: research, implementation, testing, debugging. A phase tells you what the agent was trying to accomplish without making you read two hundred individual tool calls.

- **Narrative** synthesises a session into a plain-language summary of what was accomplished, what went wrong, and what was left unfinished. This is the view for someone who needs to understand the session in thirty seconds.

### Failure analysis with evidence

Daemon doesn't just tell you something failed. It shows you the evidence from the session: the tool calls that preceded the failure, the error messages, the recovery attempts. Each failure is linked back to its source events so you can trace the full causal chain.

Failures are categorised by impact and type, so you can distinguish between a minor formatting issue and a critical architectural decision that will compound across future sessions.

### Actionable improvement recommendations

Every failure pattern daemon identifies comes paired with a recommendation for how to prevent it. These recommendations target the harness itself: hooks, skills, subagents, tools, context, architecture, and legibility. They tell you what to change in your CLAUDE.md, your hooks, your tool configuration, or your repository structure so the agent doesn't hit the same problem again.

This is the feedback loop that harness engineering depends on. The agent works, daemon watches, the human improves the harness, the agent works better next time.

---

## Harness engineering

Daemon is built on the principles of harness engineering, a discipline emerging from teams that have pushed agent autonomy to its limits.

The term comes from the infrastructure that surrounds a long-running agent: the CLAUDE.md that gives it direction, the hooks that enforce invariants, the tools that extend its capabilities, the feedback loops that catch failures before they compound. This infrastructure is the harness, and engineering it well is what separates a productive agent from one that drifts, repeats mistakes, or silently degrades the codebase it works in.

The foundational ideas draw from two key documents:

**"Harness engineering: leveraging Codex in an agent-first world"** (OpenAI, February 2026) describes a team that built a production product entirely through agent-generated code. Their core insight: the engineer's job is no longer writing code but designing environments, specifying intent, and building feedback loops. They discovered that repository knowledge must be the system of record, that context is a scarce resource requiring progressive disclosure, and that enforcing architecture mechanically through linters and structural tests is what enables speed without decay.

**"Effective Harnesses for Long-Running Agents"** and **"Long-running Claude for scientific computing"** (Anthropic, 2025-2026) tackle the specific problem of agents working across context compaction boundaries. Their solutions address the most common failure modes: agents trying to do too much at once, agents declaring victory prematurely, and context loss across compaction horizons. Progress files, feature lists, git-based coordination, and test oracles are the building blocks of effective multi-session work.

Daemon sits at the intersection of these ideas. Where harness engineering tells you how to build the environment, daemon tells you how well the environment is working. It closes the loop between agent execution and harness improvement by making the agent's actual behaviour visible, analysable, and actionable.

---

## How it works

Daemon monitors **Claude Code** sessions. It connects via two mechanisms:

1. **HTTP hooks** — Claude Code fires hooks on every tool call, session start/end, subagent activity, and errors. Daemon receives these at `POST /api/events`.
2. **OpenTelemetry** — Claude Code's built-in telemetry exporter sends metrics and logs to daemon's OTLP endpoint at `POST /api/otel`.

When you trigger analysis, daemon spawns a Claude agent that processes the session's event stream and produces structured results (timeline, failures, improvements). These results are stored in SQLite and displayed in the web UI.

See [docs/setup.md](./docs/setup.md) for installation and configuration.

---

## Architecture

Daemon follows Domain-Driven Design on the backend and Feature-Sliced Design on the frontend.

```
src/
  server/
    domain/           Pure entities, repository interfaces, ports
    application/      Use cases orchestrating domain + infrastructure
    infrastructure/   SQLite, Claude runner, WebSocket, GraphQL
  shared/             UI primitives, utilities, hooks
  entities/           Entity models and display components
  features/           Timeline, failures, improvements, session
  app/                Next.js pages composing features
```

The frontend provides four views:
- **Timeline** for exploring session plans and tasks at multiple resolutions
- **Harness** for running and reviewing analyses
- **Sessions** for browsing and comparing Claude Code sessions
- **Setup** for configuring daemon's connection to Claude Code

See [docs/architecture.md](./docs/architecture.md) for the full technical breakdown.

---

## Design

Three colours. Symbols. Nothing else.

Daemon's visual language uses exactly three colours derived from Anthropic's palette: void (neon black), bone (warm parchment), and ember (Claude's warm amber). Status is communicated through symbols and typography rather than colour coding.

See [DESIGN.md](./DESIGN.md) for the full design system specification.

---

## Status

This is a **proof of concept** (v0.1). The core timeline, failure analysis, and improvement recommendation features are functional. The system has been used to monitor its own development, with Claude Code agents building daemon while daemon watches them work.

Daemon currently monitors Claude Code only. Support for other agent runtimes is not implemented but the architecture (OpenTelemetry ingestion, structured analysis) could extend to other systems.

---

## Documentation

- [Setup guide](./docs/setup.md) — Installation, Claude Code connection, API reference
- [Architecture](./docs/architecture.md) — DDD backend, FSD frontend, data flows
- [Harness engineering](./docs/harness-engineering.md) — Founding principles and daemon's position in the stack
- [Design system](./DESIGN.md) — Three-colour visual language

---

## References

- [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) — OpenAI, February 2026
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/research/long-running-claude) — Anthropic, November 2025
- [Long-running Claude for scientific computing](https://www.anthropic.com/research/long-running-Claude) — Anthropic, March 2026

---

*daemon watches the watchers.*
