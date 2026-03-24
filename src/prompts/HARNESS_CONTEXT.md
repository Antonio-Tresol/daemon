# Harness Engineering Context

Harness engineering is the discipline of designing environments where AI agents can do reliable work. The human's job is not to write the code — it's to build the system that makes the agent succeed. The code is the agent's output; the harness is yours.

## Core Principles

### Agent-First Codebase
Code is optimized for agent legibility, not human preference. If the agent can't see it, it doesn't exist. Every convention, pattern, and architectural boundary must be discoverable within the agent's context window. Human tribal knowledge is worthless to an agent.

### Context Horizon
Agents have limited context windows. Everything important must be surfaced within that window. This means short, precise documentation at the point of use — not sprawling wikis three clicks away. The context horizon is the hard boundary of what the agent can reason about.

### Session Amnesia
Each new session starts cold. There is no memory of what happened yesterday. Knowledge must be encoded in the repository — in CLAUDE.md, in code comments, in type signatures, in test names. If you told the agent something last session but didn't write it down, you never told it at all.

### Throwness
Agents are "thrown" into codebases without history or orientation. They need maps, not manuals. A table of contents with clear pointers beats a 1000-line README. The agent must be able to orient itself in seconds: What is this repo? What are the layers? Where do I put new code? What patterns do I follow?

### Progressive Disclosure
Give agents a table of contents, not a textbook. CLAUDE.md should be ~100 lines: architecture overview, key conventions, pointers to deeper docs. Let the agent drill down into `docs/` when it needs detail. Front-load the map; hide the territory.

### Enforce, Don't Instruct
Lints, hooks, and structural tests beat documentation every time. Documentation drifts; code doesn't. If a pattern matters, make violating it mechanically impossible. Pre-commit hooks that block bad imports > a paragraph in CLAUDE.md saying "don't do this."

### Feedback Loops Are Leverage
The fastest way to improve agent output is tighter, faster feedback loops. Auto-run tests after edits. Auto-lint after writes. Auto-typecheck after changes. The agent should know within seconds whether its change is correct, not after a manual review cycle.

### Repository as System of Record
Slack discussions, Google Docs, meeting notes, tacit knowledge — if it's not in the repo, the agent can't use it. Pull decisions into ADRs. Pull conventions into CLAUDE.md. Pull API contracts into types. The repository is the single source of truth.

## Categories of Harness Improvement

### Hooks
Pre/post tool hooks for enforcement and feedback. Auto-format after writes, block dangerous patterns before execution, validate architectural boundaries on every edit, run typechecks after code changes. Hooks are the fastest path from "agent did something" to "agent knows if it was correct."

### Skills
Custom slash commands for repeatable workflows. Package multi-step procedures (deploy, review, refactor) into skills so the agent executes them consistently every time. Skills encode tribal knowledge into executable form.

### Subagents
Agent teams for parallel work. If backend, frontend, and tests are independent, run them concurrently. Decompose large tasks into specialized roles. Research and implementation can often run in parallel with proper coordination.

### Tools
MCP servers, custom tools, and observability integrations that extend the agent's reach. Database access, browser automation, external API integration, monitoring dashboards. Tools bridge the gap between what the agent can reason about and what it can act on.

### Context
CLAUDE.md, docs/, design docs, architecture maps. The written knowledge that orients the agent. Progressive disclosure: short top-level overview pointing to detailed docs. Core beliefs, design principles, naming conventions, dependency rules — all codified.

### Architecture
Layer boundaries, dependency rules, naming conventions enforced mechanically. Structural tests that fail when imports cross boundaries. Lint rules that enforce naming patterns. The architecture should be self-enforcing, not self-documenting.

### Legibility
Structured logging, error messages with remediation steps, self-documenting APIs, explicit type signatures. The codebase should be optimized for agent comprehension. Opaque abstractions, magic strings, and implicit conventions are the enemy.
