import type { Session } from '../../domain/session/session.entity';
import type { SessionRepository } from '../../domain/session/session.repository';
import { getDatabase } from './sqlite';

interface SessionRow {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  cwd: string | null;
  project_hash: string | null;
  total_events: number;
  total_cost_usd: number;
}

function rowToEntity(row: SessionRow): Session {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as Session['status'],
    cwd: row.cwd,
    projectHash: row.project_hash,
    totalEvents: row.total_events,
    totalCostUsd: row.total_cost_usd,
  };
}

export class SqliteSessionRepository implements SessionRepository {
  save(session: Session): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sessions (id, start_time, end_time, status, cwd, project_hash, total_events, total_cost_usd)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      session.id,
      session.startTime,
      session.endTime,
      session.status,
      session.cwd,
      session.projectHash,
      session.totalEvents,
      session.totalCostUsd,
    );
  }

  update(session: Session): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE sessions
      SET start_time = ?, end_time = ?, status = ?, cwd = ?, project_hash = ?, total_events = ?, total_cost_usd = ?
      WHERE id = ?
    `);
    stmt.run(
      session.startTime,
      session.endTime,
      session.status,
      session.cwd,
      session.projectHash,
      session.totalEvents,
      session.totalCostUsd,
      session.id,
    );
  }

  findById(id: string): Session | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as SessionRow | undefined;
    return row ? rowToEntity(row) : null;
  }

  findAll(): Session[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM sessions ORDER BY start_time DESC',
    );
    const rows = stmt.all() as SessionRow[];
    return rows.map(rowToEntity);
  }

  findActive(): Session[] {
    const db = getDatabase();
    const stmt = db.prepare(
      "SELECT * FROM sessions WHERE status = 'active' ORDER BY start_time DESC",
    );
    const rows = stmt.all() as SessionRow[];
    return rows.map(rowToEntity);
  }
}
