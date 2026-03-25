import { getDatabase } from '../db/sqlite';
import { parseAnalysisJson } from '../../../shared/lib/parse-json';
import type {
  AnalysisResult,
  Failure,
  Improvement,
  TimelinePlan,
} from '../../../entities/analysis/model';

interface SessionRow {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  cwd: string | null;
  name: string | null;
  group_label: string | null;
  total_events: number;
  total_cost_usd: number;
}

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

interface AnalysisRow {
  id: string;
  session_id: string;
  analysis_type: string;
  triggered_at: string;
  completed_at: string | null;
  status: string;
  result: string | null;
  error: string | null;
}

function mapSession(row: SessionRow) {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    cwd: row.cwd,
    name: row.name,
    groupLabel: row.group_label,
    totalEvents: row.total_events,
    totalCostUsd: row.total_cost_usd,
  };
}

function mapEvent(row: EventRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    timestamp: row.timestamp,
    eventType: row.event_type,
    toolName: row.tool_name,
    success: row.success === null ? null : row.success === 1,
    durationMs: row.duration_ms,
    promptId: row.prompt_id,
  };
}

function parseAnalysisResult(row: AnalysisRow): AnalysisResult['result'] {
  return parseAnalysisJson<AnalysisResult['result']>(row.result);
}

function getFailuresFromAnalysis(
  sessionId: string,
): Failure[] {
  const db = getDatabase();
  const row = db
    .prepare(
      "SELECT * FROM analyses WHERE session_id = ? AND analysis_type = 'failures' AND status = 'completed' ORDER BY triggered_at DESC LIMIT 1",
    )
    .get(sessionId) as AnalysisRow | undefined; // .get() returns unknown
  if (!row) return [];
  const result = parseAnalysisResult(row);
  return (result?.failures ?? []) as Failure[]; // parsed analysis result is loosely typed
}

function getImprovementsFromAnalysis(
  sessionId: string,
): Improvement[] {
  const db = getDatabase();
  const row = db
    .prepare(
      "SELECT * FROM analyses WHERE session_id = ? AND analysis_type = 'improvements' AND status = 'completed' ORDER BY triggered_at DESC LIMIT 1",
    )
    .get(sessionId) as AnalysisRow | undefined; // .get() returns unknown
  if (!row) return [];
  const result = parseAnalysisResult(row);
  return (result?.improvements ?? []) as Improvement[]; // parsed analysis result is loosely typed
}

function getTimelinePlansFromAnalysis(
  sessionId: string,
): TimelinePlan[] {
  const db = getDatabase();
  const row = db
    .prepare(
      "SELECT * FROM analyses WHERE session_id = ? AND analysis_type = 'timeline' AND status = 'completed' ORDER BY triggered_at DESC LIMIT 1",
    )
    .get(sessionId) as AnalysisRow | undefined; // .get() returns unknown
  if (!row) return [];
  const result = parseAnalysisResult(row);
  return (result?.plans ?? []) as TimelinePlan[]; // parsed analysis result is loosely typed
}

export const resolvers = {
  Query: {
    sessions: (
      _parent: unknown,
      args: { status?: string; limit?: number },
    ) => {
      const db = getDatabase();
      const limit = Math.min(args.limit ?? 50, 200);
      let query =
        'SELECT * FROM sessions WHERE 1=1';
      const params: (string | number)[] = [];

      if (args.status) {
        query += ' AND status = ?';
        params.push(args.status);
      }
      query += ' ORDER BY start_time DESC LIMIT ?';
      params.push(limit);

      const rows = db.prepare(query).all(...params) as SessionRow[]; // .all() returns unknown[]
      return rows.map(mapSession);
    },

    session: (
      _parent: unknown,
      args: { id: string },
    ) => {
      const db = getDatabase();
      const row = db
        .prepare('SELECT * FROM sessions WHERE id = ?')
        .get(args.id) as SessionRow | undefined; // .get() returns unknown
      return row ? mapSession(row) : null;
    },

    timeline: (
      _parent: unknown,
      args: { sessionId: string },
    ) => {
      return { sessionId: args.sessionId };
    },

    failures: (
      _parent: unknown,
      args: { sessionId: string; impact?: string; type?: string },
    ) => {
      let failures = getFailuresFromAnalysis(args.sessionId);
      if (args.impact) {
        const impactLower = args.impact.toLowerCase();
        failures = failures.filter(
          (f) => f.impact.toLowerCase() === impactLower,
        );
      }
      if (args.type) {
        failures = failures.filter((f) => f.type === args.type);
      }
      return failures;
    },

    improvements: (
      _parent: unknown,
      args: {
        sessionId: string;
        area?: string;
        severity?: string;
      },
    ) => {
      let improvements = getImprovementsFromAnalysis(args.sessionId);
      if (args.area) {
        const areaLower = args.area.toLowerCase();
        improvements = improvements.filter(
          (i) => i.area.toLowerCase() === areaLower,
        );
      }
      if (args.severity) {
        const sevLower = args.severity.toLowerCase();
        improvements = improvements.filter(
          (i) => i.severity.toLowerCase() === sevLower,
        );
      }
      return improvements.map((i) => ({
        ...i,
        config: i.config ? JSON.stringify(i.config) : null,
      }));
    },

    events: (
      _parent: unknown,
      args: { sessionId: string; type?: string; toolName?: string },
    ) => {
      const db = getDatabase();
      let query =
        'SELECT * FROM events WHERE session_id = ?';
      const params: (string | number)[] = [args.sessionId];

      if (args.type) {
        query += ' AND event_type = ?';
        params.push(args.type);
      }
      if (args.toolName) {
        query += ' AND tool_name = ?';
        params.push(args.toolName);
      }
      query += ' ORDER BY timestamp ASC';

      const rows = db.prepare(query).all(...params) as EventRow[]; // .all() returns unknown[]
      return rows.map(mapEvent);
    },

    groups: () => {
      const db = getDatabase();
      const rows = db.prepare(
        'SELECT DISTINCT group_label FROM sessions WHERE group_label IS NOT NULL ORDER BY group_label ASC',
      ).all() as Array<{ group_label: string }>; // .all() returns unknown[]
      return rows.map((r) => r.group_label);
    },

    failureSummary: (
      _parent: unknown,
      args: { sessionId: string },
    ) => {
      const failures = getFailuresFromAnalysis(args.sessionId);
      const byTypeMap = new Map<string, number>();
      const byImpactMap = new Map<string, number>();

      for (const f of failures) {
        byTypeMap.set(f.type, (byTypeMap.get(f.type) ?? 0) + 1);
        byImpactMap.set(f.impact, (byImpactMap.get(f.impact) ?? 0) + 1);
      }

      return {
        byType: Array.from(byTypeMap.entries()).map(([type, count]) => ({
          type,
          count,
        })),
        byImpact: Array.from(byImpactMap.entries()).map(
          ([impact, count]) => ({ impact, count }),
        ),
        total: failures.length,
      };
    },
  },

  Mutation: {
    updateSession: (
      _parent: unknown,
      args: { id: string; name?: string; groupLabel?: string },
    ) => {
      const db = getDatabase();

      const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(args.id) as { id: string } | undefined; // .get() returns unknown
      if (!existing) return null;

      const sets: string[] = [];
      const values: (string | number)[] = [];

      if (args.name !== undefined) {
        sets.push('name = ?');
        values.push(args.name);
      }
      if (args.groupLabel !== undefined) {
        sets.push('group_label = ?');
        values.push(args.groupLabel);
      }

      if (sets.length > 0) {
        values.push(args.id);
        db.prepare(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`).run(...values);
      }

      const updated = db.prepare('SELECT * FROM sessions WHERE id = ?').get(args.id) as SessionRow; // .get() returns unknown
      return mapSession(updated);
    },

    analyze: (
      _parent: unknown,
      args: { sessionId: string; type: string; level?: number },
    ) => {
      const db = getDatabase();
      const analysisId = crypto.randomUUID();
      const triggeredAt = new Date().toISOString();
      const analysisType = args.type.toLowerCase();
      const level = args.level ?? 0;

      db.prepare(
        `INSERT INTO analyses (id, session_id, analysis_type, triggered_at, status) VALUES (?, ?, ?, ?, 'pending')`,
      ).run(analysisId, args.sessionId, analysisType, triggeredAt);

      return {
        id: analysisId,
        sessionId: args.sessionId,
        analysisType,
        status: 'pending',
        level,
        triggeredAt,
        completedAt: null,
        error: null,
      };
    },
  },

  Timeline: {
    plans: (
      parent: { sessionId: string },
      _args: { level?: number },
    ) => {
      return getTimelinePlansFromAnalysis(parent.sessionId);
    },
  },
};
