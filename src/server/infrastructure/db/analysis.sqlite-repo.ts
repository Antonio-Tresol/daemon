import type {
  AnalysisResult,
  AnalysisType,
} from '../../domain/analysis/analysis.entity';
import type { AnalysisRepository } from '../../domain/analysis/analysis.repository';
import { getDatabase } from './sqlite';

interface AnalysisRow {
  id: string;
  session_id: string;
  analysis_type: string;
  level: number;
  triggered_at: string;
  completed_at: string | null;
  status: string;
  result: string | null;
  error: string | null;
}

function rowToEntity(row: AnalysisRow): AnalysisResult {
  return {
    id: row.id,
    sessionId: row.session_id,
    analysisType: row.analysis_type as AnalysisType,
    level: row.level,
    triggeredAt: row.triggered_at,
    completedAt: row.completed_at,
    status: row.status as AnalysisResult['status'],
    result: row.result
      ? (JSON.parse(row.result) as AnalysisResult['result'])
      : null,
    error: row.error,
  };
}

export class SqliteAnalysisRepository implements AnalysisRepository {
  save(analysis: AnalysisResult): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO analyses (id, session_id, analysis_type, level, triggered_at, completed_at, status, result, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      analysis.id,
      analysis.sessionId,
      analysis.analysisType,
      analysis.level,
      analysis.triggeredAt,
      analysis.completedAt,
      analysis.status,
      analysis.result ? JSON.stringify(analysis.result) : null,
      analysis.error,
    );
  }

  update(analysis: AnalysisResult): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE analyses
      SET completed_at = ?, status = ?, result = ?, error = ?
      WHERE id = ?
    `);
    stmt.run(
      analysis.completedAt,
      analysis.status,
      analysis.result ? JSON.stringify(analysis.result) : null,
      analysis.error,
      analysis.id,
    );
  }

  findById(id: string): AnalysisResult | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM analyses WHERE id = ?');
    const row = stmt.get(id) as AnalysisRow | undefined;
    return row ? rowToEntity(row) : null;
  }

  findBySessionId(sessionId: string, level?: number): AnalysisResult[] {
    const db = getDatabase();
    if (level !== undefined) {
      const stmt = db.prepare(
        'SELECT * FROM analyses WHERE session_id = ? AND level = ? ORDER BY triggered_at DESC',
      );
      const rows = stmt.all(sessionId, level) as AnalysisRow[];
      return rows.map(rowToEntity);
    }
    const stmt = db.prepare(
      'SELECT * FROM analyses WHERE session_id = ? ORDER BY triggered_at DESC',
    );
    const rows = stmt.all(sessionId) as AnalysisRow[];
    return rows.map(rowToEntity);
  }

  findLatestByType(
    sessionId: string,
    analysisType: AnalysisType,
    level?: number,
  ): AnalysisResult | null {
    const db = getDatabase();
    if (level !== undefined) {
      const stmt = db.prepare(
        'SELECT * FROM analyses WHERE session_id = ? AND analysis_type = ? AND level = ? ORDER BY triggered_at DESC LIMIT 1',
      );
      const row = stmt.get(sessionId, analysisType, level) as AnalysisRow | undefined;
      return row ? rowToEntity(row) : null;
    }
    const stmt = db.prepare(
      'SELECT * FROM analyses WHERE session_id = ? AND analysis_type = ? ORDER BY triggered_at DESC LIMIT 1',
    );
    const row = stmt.get(sessionId, analysisType) as AnalysisRow | undefined;
    return row ? rowToEntity(row) : null;
  }

  findBySessionIdAndLevel(
    sessionId: string,
    analysisType: AnalysisType,
    level: number,
  ): AnalysisResult | null {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM analyses WHERE session_id = ? AND analysis_type = ? AND level = ? AND status = \'completed\' ORDER BY triggered_at DESC LIMIT 1',
    );
    const row = stmt.get(sessionId, analysisType, level) as AnalysisRow | undefined;
    return row ? rowToEntity(row) : null;
  }
}
