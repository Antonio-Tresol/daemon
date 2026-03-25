# Harness engineering

Daemon is built on the principles of harness engineering, a discipline that emerged from teams pushing agent autonomy to production scale. This document explains the ideas that shaped daemon's design and how daemon fits into the harness engineering workflow.

---

## The shift

Software engineering is undergoing a structural change. The work of building software is moving from writing code to designing environments where agents can write code effectively. Two foundational documents describe this shift from different angles, and together they form the intellectual basis for daemon.

### Designing agent environments

In February 2026, Ryan Lopopolo's team at OpenAI published their experience building and shipping an internal product with zero lines of manually-written code. Over five months, a small team of three engineers drove Codex to produce roughly a million lines of code across application logic, infrastructure, tooling, documentation, and internal utilities. Their throughput averaged 3.5 pull requests per engineer per day, and it increased as the team grew.

The core insight was that the engineer's role had fundamentally changed. When something failed, the fix was almost never to try harder. Because the only way to make progress was to get the agent to do the work, humans always stepped into the task and asked: what capability is missing, and how do we make it both legible and enforceable for the agent?

This reframing produced several principles that daemon is designed to support:

**Repository knowledge as the system of record.** Anything the agent can't access in-context while running effectively doesn't exist. Knowledge that lives in chat threads, Google Docs, or people's heads is invisible to the system. Daemon extends this principle to session history: past failures, improvement recommendations, and session analyses are all queryable artifacts, not ephemeral observations.

**Progressive disclosure over instruction manuals.** A giant instruction file crowds out the task, the code, and the relevant docs. Daemon applies this to session exploration: you start with a narrative summary, drill into phases when you need more detail, and examine individual events only when debugging a specific failure.

**Mechanical enforcement over documentation.** Rules that aren't enforced mechanically will be violated. Daemon tracks whether harness improvements are actually reducing failure rates across sessions, turning recommendations into measurable outcomes.

**Agent legibility as the design target.** The codebase should be optimised first for the agent's ability to navigate and reason about it. Daemon's improvement recommendations specifically target legibility: is the CLAUDE.md clear enough, are the architectural boundaries discoverable, does the agent have the tools it needs?

### Working across context boundaries

In November 2025, Anthropic published their findings on effective harnesses for long-running agents. The core challenge they identified: agents must work in discrete sessions, and each new session begins with no memory of what came before. This is like a software project staffed by engineers working in shifts, where each new engineer arrives with no memory of what happened on the previous shift.

Their solution decomposed the problem into two parts: an initialiser agent that sets up the environment on the first run, and a coding agent that makes incremental progress in every session while leaving clear artifacts for the next session. The key insight was that agents need structured ways to understand the state of work when starting with a fresh context window.

They identified four failure modes that daemon is designed to detect and help prevent:

| Failure mode | What happens | How daemon helps |
|---|---|---|
| Agent declares victory too early | Agent sees progress has been made and stops before completing the actual goal | Daemon's timeline analysis shows what was actually accomplished vs what was intended, making premature completion visible |
| Agent leaves environment in broken state | Half-implemented features, undocumented progress, broken tests across compaction boundaries | Daemon's failure analysis identifies sessions that ended with unresolved errors or incomplete work |
| Agent marks features done without testing | Code changes look correct but aren't verified end-to-end | Daemon tracks tool usage patterns and can identify sessions where testing tools were never invoked |
| Agent wastes time reconstructing context | New session spends tokens figuring out what happened instead of making progress | Daemon's session history and analysis results are queryable, giving future sessions structured context about past work |

In March 2026, Anthropic extended these findings to scientific computing, describing a cosmological Boltzmann solver built by Claude over several days of autonomous work. This demonstrated the pattern at a larger scale: a progress file as portable long-term memory, a reference implementation as a test oracle, and git as the coordination mechanism. The agent worked for hours at a stretch, with the human checking in occasionally by phone while waiting in line for coffee.

---

## The feedback loop

Harness engineering is fundamentally about feedback loops. The agent works. Something goes wrong. A human identifies the gap. The harness is improved. The agent works better next time.

Daemon makes this loop faster and more precise by answering three questions:

### What happened?

The timeline view reconstructs a session into a structured narrative. Instead of reading hundreds of tool calls, you see phases of work (research, implementation, testing, debugging) with their outcomes. You can drill down from a thirty-second narrative summary to individual events when you need to understand exactly what the agent did and why.

### What went wrong?

The failure analysis identifies real failures in the session, not just errors (agents recover from many errors as part of normal operation) but patterns that indicate the harness failed the agent. Each failure is linked to evidence: the specific events that show what happened, the tool calls that preceded the failure, the recovery attempts that followed.

Failures are classified by type (tool failure, permission denied, logic error, timeout) and impact (critical, warning, informational) so you can focus on what matters.

### What should change?

The improvement analysis examines failures and session patterns to produce actionable recommendations targeting seven areas of the harness:

- **Hooks** — Pre/post-tool hooks that enforce invariants automatically. If the agent keeps making the same formatting mistake, a hook can catch it before it lands.
- **Skills** — Reusable slash commands that encode common workflows. If the agent frequently performs the same multi-step operation, a skill can make it a single command.
- **Subagents** — Agent teams for parallel work. If a session shows sequential work that could have been parallelised, subagents can speed it up.
- **Tools** — MCP servers and integrations. If the agent lacks access to information it needs, a tool can provide it.
- **Context** — CLAUDE.md, architecture documentation, design documents. If the agent makes decisions that contradict project conventions, better context can prevent it.
- **Architecture** — Layer boundaries, dependency rules, structural lints. If the agent violates architectural constraints, mechanical enforcement can catch it.
- **Legibility** — Agent-friendly code organisation, naming conventions, documentation patterns. If the agent struggles to navigate the codebase, legibility improvements can help.

Each recommendation includes evidence from the session, a specific change to make, and the expected impact.

---

## The compaction problem

Long-running agents face a unique challenge that daemon is specifically designed to address: context compaction.

When an agent's context window fills up, it must be compacted: the full conversation is summarised, and the agent continues with a condensed version of its history. This is necessary for agents to work beyond a single context window, but it introduces information loss. Details about failed approaches, architectural decisions, and intermediate state can be lost during compaction.

This creates three problems that compound over time:

**Repeated failures.** An agent that lost the memory of why a particular approach failed will try it again. Daemon's failure analysis persists across compaction boundaries, so a future session (or a human reviewing the harness) can see that a specific pattern has been tried and failed.

**Architectural drift.** An agent that lost the memory of an architectural decision made earlier in the session may make a contradictory decision later. Daemon's timeline analysis shows how decisions evolved across a session, making drift visible even when the agent itself can't see it.

**Invisible regression.** An agent that compacted away the context of a working feature may break it while implementing a new one. Daemon's event-level tracking shows exactly when regressions were introduced, even if the agent didn't notice.

The harness engineering response to compaction is to encode important context outside the agent's memory: in progress files, git history, CLAUDE.md, and structured artifacts. Daemon adds another layer: the analysis results themselves become external memory that persists across sessions and compaction boundaries.

---

## Daemon's position in the stack

In the harness engineering model, there are three layers:

```
┌─────────────────────────────────────┐
│           The Human                  │
│   Sets goals, reviews outcomes,      │
│   improves the harness               │
├─────────────────────────────────────┤
│           Daemon                     │
│   Watches sessions, identifies       │
│   failures, recommends improvements  │
├─────────────────────────────────────┤
│           The Harness                │
│   CLAUDE.md, hooks, skills, tools,   │
│   architecture, tests, docs          │
├─────────────────────────────────────┤
│           The Agent                  │
│   Works within the harness,          │
│   produces code, runs for hours      │
└─────────────────────────────────────┘
```

The agent works within the harness. Daemon observes the agent's work and produces structured analysis. The human reads daemon's analysis and improves the harness. The improved harness makes the agent more effective. This is the cycle that harness engineering depends on, and daemon is the component that makes the cycle visible.

Without daemon (or something like it), the human must read raw session logs to understand what happened. This works for short sessions but breaks down when agents run for hours across multiple compaction horizons. The whole point of harness engineering is that human attention is the scarcest resource. Daemon exists to make the most of it.

---

## Principles

These principles guide daemon's design, drawn from the harness engineering literature:

**Watch, don't block.** Daemon observes agent sessions through HTTP hooks. It never interrupts the agent's work or adds latency to tool calls. Monitoring must be invisible to the thing being monitored.

**Evidence over opinion.** Every failure and recommendation in daemon is linked to specific events in the session. You can always trace a finding back to what actually happened.

**Multiple resolutions.** Not every question requires the same depth. A narrative summary answers "what happened?" in thirty seconds. Event-level detail answers "why did this specific tool call fail?" Both are valid questions with different costs.

**Harness-first recommendations.** When something goes wrong, daemon's recommendations target the harness, not the agent. The agent is a constant (for a given model version). The harness is the variable you can improve.

**Agents as consumers.** Daemon's API is designed for agents to query, not just humans to browse. A future agent session can check daemon for past failures before starting work, creating a feedback loop that doesn't require human intervention.

---

## Further reading

- "Harness engineering: leveraging Codex in an agent-first world" — OpenAI Engineering, February 2026
- "Effective Harnesses for Long-Running Agents" — Anthropic Engineering, November 2025
- "Long-running Claude for scientific computing" — Anthropic Discovery, March 2026
