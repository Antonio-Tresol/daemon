import { v4 as uuidv4 } from 'uuid';
import type { HookEvent, EventType } from '../domain/event/event.entity';
import type { EventRepository } from '../domain/event/event.repository';
import type { Session } from '../domain/session/session.entity';
import type { SessionRepository } from '../domain/session/session.repository';

interface RawEventInput {
  sessionId: string;
  eventType: string;
  timestamp?: string;
  toolName?: string | null;
  success?: boolean | null;
  durationMs?: number | null;
  promptId?: string | null;
  payload?: Record<string, unknown>;
  cwd?: string | null;
}

const VALID_EVENT_TYPES = new Set<string>([
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

function normalizeEventType(raw: string): EventType {
  if (VALID_EVENT_TYPES.has(raw)) {
    return raw as EventType;
  }
  // Map common OTel event names
  if (raw.includes('error')) return 'api_error';
  if (raw.includes('request')) return 'api_request';
  if (raw.includes('tool')) return 'tool_result';
  return 'Notification';
}

export class IngestEventUseCase {
  constructor(
    private readonly eventRepo: EventRepository,
    private readonly sessionRepo: SessionRepository,
  ) {}

  execute(input: RawEventInput): HookEvent {
    const event: HookEvent = {
      id: uuidv4(),
      sessionId: input.sessionId,
      timestamp: input.timestamp ?? new Date().toISOString(),
      eventType: normalizeEventType(input.eventType),
      toolName: input.toolName ?? null,
      success: input.success ?? null,
      durationMs: input.durationMs ?? null,
      promptId: input.promptId ?? null,
      payload: input.payload ?? {},
    };

    this.eventRepo.save(event);
    this.ensureSession(event, input.cwd ?? null);

    return event;
  }

  private ensureSession(event: HookEvent, cwd: string | null): void {
    let session = this.sessionRepo.findById(event.sessionId);

    if (!session) {
      const newSession: Session = {
        id: event.sessionId,
        startTime: event.timestamp,
        endTime: null,
        status: 'active',
        cwd,
        projectHash: null,
        totalEvents: 1,
        totalCostUsd: 0,
        name: null,
        groupLabel: null,
      };
      this.sessionRepo.save(newSession);
      return;
    }

    session = {
      ...session,
      totalEvents: this.eventRepo.countBySessionId(event.sessionId),
    };

    if (event.eventType === 'SessionEnd' || event.eventType === 'Stop') {
      session = {
        ...session,
        endTime: event.timestamp,
        status: 'completed',
      };
    }

    if (event.eventType === 'api_error') {
      session = {
        ...session,
        status: 'error',
      };
    }

    if (cwd && !session.cwd) {
      session = { ...session, cwd };
    }

    this.sessionRepo.update(session);
  }
}
