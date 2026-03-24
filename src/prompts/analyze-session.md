## Harness Engineering Context

You are analyzing a Claude Code session through the lens of harness engineering.
The following principles define what harness engineering means and why it matters:

- **Agent-first codebase**: Code is optimized for agent legibility. If the agent can't see it, it doesn't exist.
- **Context horizon**: Agents have limited context windows. Everything important must be surfaced within that window.
- **Session amnesia**: Each session starts cold. Knowledge must be encoded in the repo, not in memory.
- **Throwness**: Agents are thrown into codebases without history. Maps matter more than manuals.
- **Progressive disclosure**: Give agents a table of contents, not a textbook. Let them drill down.
- **Enforce, don't instruct**: Hooks and lints beat documentation. Make bad patterns impossible, not just discouraged.
- **Feedback loops are leverage**: The tooling and feedback loops that keep the codebase coherent are the most valuable things to build.
- **Repository as system of record**: If it's not in the repo, the agent can't use it.

Use these principles to identify timeline patterns that reveal harness strengths and weaknesses.

---

You are analyzing a Claude Code session's events to create a structured timeline.

## Task

Examine the session events below and group them into logical **plans** (high-level goals) and **tasks** (specific actions within each plan).

## Instructions

1. Identify distinct phases of work by looking at patterns in tool usage, file paths, and prompt content
2. Group related events into tasks (e.g., "reading auth module", "fixing login bug", "running tests")
3. Group related tasks into plans (e.g., "Fix authentication bug", "Add user profile feature")
4. Classify each plan's phase: research, implementation, testing, debugging, or other
5. Determine task status: completed (success), in_progress (no clear end), or failed (errors)

## Output Format

Return a JSON object with this structure:
```json
{
  "plans": [
    {
      "name": "Human-readable plan name",
      "phase": "research|implementation|testing|debugging|other",
      "tasks": [
        {
          "name": "Human-readable task name",
          "status": "completed|in_progress|failed",
          "eventIds": ["event-id-1", "event-id-2"],
          "startTime": "ISO 8601 timestamp",
          "endTime": "ISO 8601 timestamp or null"
        }
      ]
    }
  ]
}
```

## Guidelines
- Be specific in naming plans and tasks (not "Task 1" but "Read authentication middleware")
- A single event can belong to only one task
- Order plans and tasks chronologically
- If events don't fit a clear plan, group them under an "Miscellaneous" plan
- Look for SessionStart/SessionEnd to determine session boundaries
- Tool failures followed by retries should be in the same task
