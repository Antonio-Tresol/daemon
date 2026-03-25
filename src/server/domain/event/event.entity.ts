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

export const VALID_EVENT_TYPES = new Set<string>([
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'Stop',
  'SessionStart',
  'SessionEnd',
  'Notification',
  'SubagentStart',
  'SubagentStop',
  'api_request',
  'api_error',
  'user_prompt',
  'tool_result',
  'tool_decision',
]);

export function normalizeEventType(raw: string): EventType {
  if (VALID_EVENT_TYPES.has(raw)) {
    return raw as EventType; // validated by VALID_EVENT_TYPES.has() check above
  }
  // Map common OTel event names
  if (raw.includes('error')) return 'api_error';
  if (raw.includes('request')) return 'api_request';
  if (raw.includes('tool')) return 'tool_result';
  return 'Notification';
}

export class HookEvent {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly timestamp: string, // ISO 8601
    public readonly eventType: EventType,
    public readonly toolName: string | null,
    public readonly success: boolean | null,
    public readonly durationMs: number | null,
    public readonly promptId: string | null,
    public readonly payload: Record<string, unknown>,
  ) {}

  get costUsd(): number {
    return typeof this.payload?.cost_usd === 'number' ? this.payload.cost_usd : 0;
  }
}

/** Factory: create a HookEvent from raw input, normalizing eventType */
export function createHookEvent(params: {
  id: string;
  sessionId: string;
  timestamp?: string;
  eventType: string;
  toolName?: string | null;
  success?: boolean | null;
  durationMs?: number | null;
  promptId?: string | null;
  payload?: Record<string, unknown>;
}): HookEvent {
  return new HookEvent(
    params.id,
    params.sessionId,
    params.timestamp ?? new Date().toISOString(),
    normalizeEventType(params.eventType),
    params.toolName ?? null,
    params.success ?? null,
    params.durationMs ?? null,
    params.promptId ?? null,
    params.payload ?? {},
  );
}
