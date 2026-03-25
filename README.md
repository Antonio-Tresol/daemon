# daemon

**A monitoring system for long-running agents.**

When codebases become optimised harness-engineered systems, agents run for hours across multiple context compaction horizons. They make thousands of tool calls, hit failures they silently recover from, and leave behind sessions that no human has time to read end-to-end. Daemon exists because someone needs to watch the watchers.

---

## The problem

Harness engineering is redefining how software gets built. Teams at OpenAI, Anthropic, and across the industry are shipping codebases where humans steer and agents execute. Ryan Lopopolo's team at OpenAI built a million-line product with zero manually-written code. Anthropic's Discovery team ran Claude for days to build a differentiable cosmological solver. These aren't demos. These are production systems where agents work autonomously for hours, sometimes while their operators sleep.

But autonomy creates a visibility gap.

A single agent session can span hundreds of tool calls, multiple context compactions, and several hours of wall-clock time. When something goes wrong, you get a failed PR or a broken feature. When something goes subtly wrong, you get nothing at all, just a session that looks fine on the surface but made poor architectural decisions, repeated work across compaction boundaries, or silently swallowed errors that will compound later.

The longer agents run, the harder it is to answer basic questions:
- What did the agent actually do during that six-hour session?
- Where did it fail, and what evidence exists in the session?
- What patterns keep recurring across sessions?
- How can the harness be improved to prevent these failures?

Daemon answers these questions.

---

## What daemon does

Daemon ingests OpenTelemetry events from agent sessions and provides a structured interface for exploring what happened, at whatever level of depth you need.

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

**"Harness engineering: leveraging Codex in an agent-first world"** (OpenAI, February 2026) describes a team that built a production product entirely through agent-generated code. Their core insight: the engineer's job is no longer writing code but designing environments, specifying intent, and building feedback loops. They discovered that repository knowledge must be the system of record, that context is a scarce resource requiring progressive disclosure, and that enforcing architecture mechanically through linters and structural tests is what enables speed without decay. They describe agents running single tasks for six hours, and the infrastructure needed to keep them productive across those sessions.

**"Effective Harnesses for Long-Running Agents"** (Anthropic, November 2025) tackles the specific problem of agents working across context compaction boundaries. Their solution, an initialiser agent that sets up the environment and a coding agent that makes incremental progress while leaving structured artifacts, addresses the two most common failure modes: agents trying to do too much at once and agents declaring victory prematurely. Their progress files, feature lists, and git-based coordination patterns are the building blocks of effective multi-session work.

Daemon sits at the intersection of these ideas. Where harness engineering tells you how to build the environment, daemon tells you how well the environment is working. It closes the loop between agent execution and harness improvement by making the agent's actual behaviour visible, analysable, and actionable.

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

Events are ingested via an OpenTelemetry-compatible endpoint. Sessions are stored in SQLite. Analysis is performed by Claude agents that process event streams and produce structured failure reports and improvement recommendations.

The frontend provides four views:
- **Timeline** for exploring session plans and tasks at multiple resolutions
- **Harness** for running and reviewing analyses
- **Sessions** for browsing and comparing agent sessions
- **Setup** for configuring daemon's connection to your agent infrastructure

---

## Design

Three colours. Symbols. Nothing else.

Daemon's visual language uses exactly three colours derived from Anthropic's palette: void (neon black), bone (warm parchment), and ember (Claude's warm amber). Status is communicated through symbols and typography rather than colour coding, producing an interface that is cohesive, accessible, and unmistakably its own.

See [DESIGN.md](./DESIGN.md) for the full design system specification.

---

## For humans and agents

Daemon is designed for both audiences.

Humans use daemon to understand what happened during an agent session without reading thousands of events. The multi-resolution views let you start with a narrative summary and drill down to individual tool calls only when you need to. The failure and improvement views give you actionable next steps for improving your harness.

Agents use daemon's structured output to understand their own history. A future agent session can query daemon for past failures in the same codebase, see what improvement recommendations have been made, and adjust its approach accordingly. This creates a second feedback loop: not just human-improves-harness, but agent-learns-from-history.

The goal is an agent-first development environment where the harness continuously improves, failures are caught early, and both humans and agents have the visibility they need to do their best work.

---

## Status

Daemon is in active development (v0.1). The core timeline, failure analysis, and improvement recommendation features are functional. The system has been used to monitor its own development, with Claude agents building daemon while daemon watches them work.

---

*daemon watches the watchers.*
