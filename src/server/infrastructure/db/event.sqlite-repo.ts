import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { HookEvent } from '../../domain/event/event.entity';
import type { EventRepository } from '../../domain/event/event.repository';
import { events } from './drizzle-schema';
import { getDb } from './sqlite';

export class SqliteEventRepository implements EventRepository {
  private mapToDomain(row: typeof events.$inferSelect): HookEvent {
    return new HookEvent(
      row.id,
      row.sessionId,
      row.timestamp,
      row.eventType as HookEvent['eventType'],
      row.toolName,
      row.success,
      row.durationMs,
      row.promptId,
      row.payload as Record<string, unknown>,
    );
  }

  save(event: HookEvent): void {
    const db = getDb();
    db.insert(events)
      .values({
        id: event.id,
        sessionId: event.sessionId,
        timestamp: event.timestamp,
        eventType: event.eventType,
        toolName: event.toolName ?? null,
        success: event.success ?? null,
        durationMs: event.durationMs ?? null,
        promptId: event.promptId ?? null,
        payload: event.payload,
      })
      .onConflictDoUpdate({
        target: events.id,
        set: {
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          eventType: event.eventType,
          toolName: event.toolName ?? null,
          success: event.success ?? null,
          durationMs: event.durationMs ?? null,
          promptId: event.promptId ?? null,
          payload: event.payload,
        },
      })
      .run();
  }

  findBySessionId(sessionId: string): HookEvent[] {
    const db = getDb();
    const rows = db
      .select()
      .from(events)
      .where(eq(events.sessionId, sessionId))
      .orderBy(events.timestamp)
      .all();
    return rows.map((row) => this.mapToDomain(row));
  }

  findByTimeRange(start: string, end: string): HookEvent[] {
    const db = getDb();
    const rows = db
      .select()
      .from(events)
      .where(and(gte(events.timestamp, start), lte(events.timestamp, end)))
      .orderBy(events.timestamp)
      .all();
    return rows.map((row) => this.mapToDomain(row));
  }

  findByType(eventType: string): HookEvent[] {
    const db = getDb();
    const rows = db
      .select()
      .from(events)
      .where(eq(events.eventType, eventType))
      .orderBy(events.timestamp)
      .all();
    return rows.map((row) => this.mapToDomain(row));
  }

  countBySessionId(sessionId: string): number {
    const db = getDb();
    const result = db
      .select({ value: count() })
      .from(events)
      .where(eq(events.sessionId, sessionId))
      .get();
    return result?.value ?? 0;
  }

  findPaginated({
    sessionId,
    eventType,
    toolName,
    limit = 100,
    offset = 0,
  }: {
    sessionId?: string | null;
    eventType?: string | null;
    toolName?: string | null;
    limit?: number;
    offset?: number;
  }): HookEvent[] {
    const db = getDb();
    let query = db.select().from(events);
    const conditions = [];
    if (sessionId) conditions.push(eq(events.sessionId, sessionId));
    if (eventType) conditions.push(eq(events.eventType, eventType));
    if (toolName) conditions.push(eq(events.toolName, toolName));

    if (conditions.length > 0) {
      // Drizzle's .where() narrows the query type, but reassignment requires widening — safe because we only add valid conditions
      query = query.where(and(...conditions)) as typeof query;
    }

    const rows = query.orderBy(desc(events.timestamp)).limit(limit).offset(offset).all();
    return rows.map((row) => this.mapToDomain(row));
  }
}
