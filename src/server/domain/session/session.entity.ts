import type { HookEvent } from '../event/event.entity';

export type SessionStatus = 'active' | 'completed' | 'error';

export class Session {
  constructor(
    public readonly id: string,
    public readonly startTime: string,
    public endTime: string | null,
    public status: SessionStatus,
    public cwd: string | null,
    public readonly projectHash: string | null,
    public totalEvents: number,
    public totalCostUsd: number,
    public name: string | null,
    public groupLabel: string | null,
  ) {}

  static create(id: string, startTime: string, cwd: string | null): Session {
    return new Session(id, startTime, null, 'active', cwd, null, 1, 0, null, null);
  }

  ingestEvent(event: HookEvent, newTotalEvents: number): void {
    this.totalEvents = newTotalEvents;
    this.totalCostUsd += event.costUsd;

    if (event.eventType === 'SessionEnd' || event.eventType === 'Stop') {
      this.endTime = event.timestamp;
      this.status = 'completed';
    } else if (event.eventType === 'api_error') {
      // Simplistic modeling: an api_error event might mark session as errored.
      this.status = 'error';
    }

    // Set cwd from event payload if not already set or changed
    // In our payload, the path might be tracked externally or passed via UseCase.
  }

  setCwd(cwd: string): void {
    if (!this.cwd) {
      this.cwd = cwd;
    }
  }

  completeSession(endTime: string): void {
    this.endTime = endTime;
    this.status = 'completed';
  }

  markSessionError(): void {
    this.status = 'error';
  }
}
