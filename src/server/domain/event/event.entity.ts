export type EventType =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PostToolUseFailure'
  | 'Stop'
  | 'SessionStart'
  | 'SessionEnd'
  | 'Notification'
  | 'SubagentStart'
  | 'SubagentStop'
  | 'api_request'
  | 'api_error'
  | 'user_prompt'
  | 'tool_result'
  | 'tool_decision';

export type HookEvent = {
  id: string;
  sessionId: string;
  timestamp: string; // ISO 8601
  eventType: EventType;
  toolName: string | null;
  success: boolean | null;
  durationMs: number | null;
  promptId: string | null;
  payload: Record<string, unknown>;
};
