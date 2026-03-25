import type { HookEvent } from '../../domain/event/event.entity';
import type { EventRepository } from '../../domain/event/event.repository';
import { getDatabase } from './sqlite';

interface EventRow {
  id: string;
  session_id: string;
  timestamp: string;
  event_type: string;
  tool_name: string | null;
  success: number | null;
  duration_ms: number | null;
  prompt_id: string | null;
  payload: string;
}

function rowToEntity(row: EventRow): HookEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    timestamp: row.timestamp,
    eventType: row.event_type as HookEvent['eventType'], // DB stores string, narrowing to union type
    toolName: row.tool_name,
    success: row.success === null ? null : row.success === 1,
    durationMs: row.duration_ms,
    promptId: row.prompt_id,
    payload: JSON.parse(row.payload) as Record<string, unknown>, // JSON.parse returns unknown
  };
}

export class SqliteEventRepository implements EventRepository {
  save(event: HookEvent): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO events (id, session_id, timestamp, event_type, tool_name, success, duration_ms, prompt_id, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      event.id,
      event.sessionId,
      event.timestamp,
      event.eventType,
      event.toolName,
      event.success === null ? null : event.success ? 1 : 0,
      event.durationMs,
      event.promptId,
      JSON.stringify(event.payload),
    );
  }

  findBySessionId(sessionId: string): HookEvent[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC',
    );
    const rows = stmt.all(sessionId) as EventRow[]; // .all() returns unknown[]
    return rows.map(rowToEntity);
  }

  findByTimeRange(start: string, end: string): HookEvent[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM events WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC',
    );
    const rows = stmt.all(start, end) as EventRow[]; // .all() returns unknown[]
    return rows.map(rowToEntity);
  }

  findByType(eventType: string): HookEvent[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM events WHERE event_type = ? ORDER BY timestamp ASC',
    );
    const rows = stmt.all(eventType) as EventRow[]; // .all() returns unknown[]
    return rows.map(rowToEntity);
  }

  countBySessionId(sessionId: string): number {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT COUNT(*) as count FROM events WHERE session_id = ?',
    );
    const row = stmt.get(sessionId) as { count: number }; // .get() returns unknown
    return row.count;
  }
}
