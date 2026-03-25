import { v4 as uuidv4 } from 'uuid';
import { createHookEvent, type HookEvent } from '../domain/event/event.entity';
import type { EventRepository } from '../domain/event/event.repository';
import { Session } from '../domain/session/session.entity';
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

export class IngestEventUseCase {
  constructor(
    private readonly eventRepo: EventRepository,
    private readonly sessionRepo: SessionRepository,
  ) {}

  execute(input: RawEventInput): HookEvent {
    const event = createHookEvent({
      id: uuidv4(),
      sessionId: input.sessionId,
      timestamp: input.timestamp,
      eventType: input.eventType,
      toolName: input.toolName,
      success: input.success,
      durationMs: input.durationMs,
      promptId: input.promptId,
      payload: input.payload,
    });

    this.eventRepo.save(event);
    this.ensureSession(event, input.cwd ?? null);

    return event;
  }

  private ensureSession(event: HookEvent, cwd: string | null): void {
    let session = this.sessionRepo.findById(event.sessionId);

    if (!session) {
      session = Session.create(event.sessionId, event.timestamp, cwd);
      this.sessionRepo.save(session);
      return;
    }

    const newTotalEvents = this.eventRepo.countBySessionId(event.sessionId);
    session.ingestEvent(event, newTotalEvents);

    if (cwd) {
      session.setCwd(cwd);
    }

    this.sessionRepo.update(session);
  }
}
