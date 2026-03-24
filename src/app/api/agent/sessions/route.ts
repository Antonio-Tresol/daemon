import { type NextRequest } from 'next/server';
import { agentResponse, agentError } from '../_lib/response';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const group = searchParams.get('group');
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    let countQuery = 'SELECT COUNT(*) as count FROM sessions WHERE 1=1';
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (group) {
      query += ' AND group_label = ?';
      countQuery += ' AND group_label = ?';
      params.push(group);
      countParams.push(group);
    }

    const totalRow = db.prepare(countQuery).get(...countParams) as { count: number };

    query += ' ORDER BY start_time DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(query).all(...params) as SessionRow[];

    const sessions = rows.map((row) => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      cwd: row.cwd,
      name: row.name,
      groupLabel: row.group_label,
      totalEvents: row.total_events,
      totalCostUsd: row.total_cost_usd,
    }));

    return agentResponse(sessions, {
      total: totalRow.count,
      returned: sessions.length,
      schema: '/api/agent/schemas/Session',
      suggestions: sessions.length > 0
        ? [`Try: GET /api/agent/timeline?sessionId=${sessions[0].id}`]
        : ['No sessions found. Start a Claude Code session with hooks enabled.'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'sessions', 500);
  }
}
