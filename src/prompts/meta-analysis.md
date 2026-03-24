# Meta-Analysis: Higher-Level Timeline Aggregation

You are performing a meta-analysis on a Claude Code session timeline. You have been given a lower-level timeline (plans and tasks) and must produce a higher-level summary by grouping plans into phases or milestones.

## Harness Engineering Context

This analysis supports harness engineering by revealing the macro-level patterns of agent work. Understanding how plans cluster into phases helps identify parallelization opportunities, wasted exploration, and inefficient sequencing.

## Task

Given a Level N timeline (array of plans with tasks), produce a Level N+1 timeline with fewer, larger nodes that capture the logical structure of the session.

### Level 1 Aggregation (plans -> phases)
Group related plans into logical phases of work:
- **Research**: Plans involving reading files, exploring structure, understanding patterns
- **Scaffolding**: Plans involving creating directories, config files, project setup
- **Implementation**: Plans involving writing new code, features, components
- **Testing**: Plans involving writing or running tests, fixing test failures
- **Debugging**: Plans involving investigating and fixing bugs, errors, regressions
- **Refinement**: Plans involving refactoring, optimization, polish, cleanup

### Level 2 Aggregation (phases -> narrative)
Produce 1-3 high-level descriptions that capture the entire session narrative:
- What was the overall goal?
- What was the approach?
- What was the outcome?

## Instructions

1. Read all plans and their tasks from the input timeline
2. Identify natural phase boundaries (shifts in activity type, file focus, or tool usage patterns)
3. Group adjacent plans that share the same phase
4. Name each group with a descriptive phase title (not "Phase 1" but "Explore authentication system and plan refactor")
5. Determine the phase classification (research, scaffolding, implementation, testing, debugging, refinement)
6. Roll up task statuses: a phase is "completed" if all inner tasks completed, "failed" if any critical task failed, otherwise "in_progress"
7. Use the earliest task startTime and latest task endTime for the phase boundaries

## Output Format

Return a JSON object matching the TimelinePlan structure:

```json
{
  "plans": [
    {
      "name": "Descriptive phase name summarizing the grouped work",
      "phase": "research|scaffolding|implementation|testing|debugging|refinement",
      "tasks": [
        {
          "name": "Original plan name (now a sub-phase)",
          "status": "completed|in_progress|failed",
          "eventIds": [],
          "startTime": "ISO 8601 timestamp (earliest from grouped plans)",
          "endTime": "ISO 8601 timestamp (latest from grouped plans)"
        }
      ]
    }
  ]
}
```

## Guidelines

- Prefer fewer, meaningful phases over many small ones. A good Level 1 timeline has 3-7 phases.
- Phase names should tell a story: "Set up project scaffolding and configure build tools" not "Setup".
- If the session has a clear arc (explore -> implement -> fix -> verify), preserve that narrative.
- Adjacent plans of the same type should almost always be merged into one phase.
- A plan that spans multiple types (e.g., implement then test) should go in the dominant category.
- Level 2 should produce 1-3 nodes maximum. This is the executive summary.
- Preserve all eventIds from the underlying tasks — the meta-analysis must remain traceable.

## Input

The following is the lower-level timeline to aggregate:
