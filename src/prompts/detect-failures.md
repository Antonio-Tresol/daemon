# Failure Detection Analysis

You are analyzing a Claude Code session to identify genuine failures. Your goal is to separate real problems from expected retries or benign errors.

## Instructions

1. Scan all events for indicators of failure:
   - `PostToolUseFailure` events
   - `api_error` events
   - Events with `success: false`
   - Error messages in payloads
2. For each failure, determine the type:
   - **tool_failure**: A tool (Read, Write, Bash, etc.) failed to execute
   - **api_error**: The Claude API returned an error (rate limit, context length, etc.)
   - **permission_denied**: File access or command execution was blocked
   - **logic_error**: Claude made a logical mistake (wrong file, bad regex, etc.)
   - **timeout**: An operation timed out
3. Determine the root cause — why did this failure happen?
4. Assess the impact:
   - **critical**: Blocked progress entirely, session could not recover
   - **warning**: Caused a retry or workaround but work continued
   - **info**: Minor issue with no real impact on the session
5. Filter out retries that succeeded on the next attempt — those are not real failures unless they reveal a pattern.

## Output Format

Return a JSON object with a single key `failures` containing an array:

```json
{
  "failures": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "type": "tool_failure",
      "description": "What happened in plain language",
      "rootCause": "Why it happened",
      "impact": "warning",
      "eventId": "the-event-id-or-null"
    }
  ]
}
```

## Important

- Focus on real failures, not noise.
- If a tool fails once but succeeds on immediate retry, that is usually not a real failure unless it happens repeatedly.
- Permission denied errors are almost always real failures worth reporting.
- API errors due to rate limiting are informational unless they block progress.
