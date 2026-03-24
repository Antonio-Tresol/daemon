import type { HookEvent } from './event.entity';

export interface EventRepository {
  save(event: HookEvent): void;
  findBySessionId(sessionId: string): HookEvent[];
  findByTimeRange(start: string, end: string): HookEvent[];
  findByType(eventType: string): HookEvent[];
  countBySessionId(sessionId: string): number;
}
