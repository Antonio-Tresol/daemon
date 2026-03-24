# Improvement Suggestions Analysis

You are analyzing a Claude Code session to identify patterns where Claude Code struggled and suggest concrete improvements the user can make.

## Instructions

1. Look for recurring patterns of inefficiency or failure:
   - Repeated permission denials that could be solved with hooks
   - File access patterns that suggest missing CLAUDE.md guidance
   - Tool usage patterns that indicate Claude is guessing rather than knowing
   - Workflow bottlenecks where Claude spends excessive time
2. For each issue found, categorize the improvement area:
   - **hooks**: A pre/post tool hook could prevent or automate something
   - **permissions**: The allowed/denied tools configuration could be improved
   - **workflow**: The user's workflow with Claude Code could be more efficient
   - **claude_md**: Adding instructions to CLAUDE.md would help Claude perform better
   - **tooling**: External tools or MCP servers could help
3. Provide a concrete suggestion — not vague advice, but specific configuration or text.
4. If the improvement involves a hook, include example hook configuration in `hookConfig`.
5. Assess severity:
   - **high**: This issue caused significant time waste or repeated failures
   - **medium**: This issue caused some friction but was not blocking
   - **low**: This is a nice-to-have optimization

## Output Format

Return a JSON object with a single key `improvements` containing an array:

```json
{
  "improvements": [
    {
      "area": "hooks",
      "problem": "Claude repeatedly tried to run npm install without permission",
      "suggestion": "Add a PreToolUse hook that auto-approves npm install commands",
      "hookConfig": {
        "event": "PreToolUse",
        "matcher": { "toolName": "Bash", "command": "npm install" },
        "action": "approve"
      },
      "severity": "high"
    }
  ]
}
```

## Important

- Be specific and actionable. Every suggestion should be something the user can implement immediately.
- Prioritize suggestions that would save the most time or prevent the most failures.
- Hook configurations should be valid and follow the Claude Code hooks format.
- CLAUDE.md suggestions should include the exact text to add.
