import { type NextRequest } from 'next/server';
import { agentResponse, agentError } from '../_lib/response';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type');
    const toolName = searchParams.get('toolName');
    const limit = Math.min(Number(searchParams.get('limit') ?? 200), 500);

    if (!sessionId) {
      return agentError(
        'sessionId query parameter is required',
        'MISSING_PARAM',
        'Provide ?sessionId=<id>. List sessions at GET /api/agent/sessions',
        'events',
      );
    }

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    let countQuery = 'SELECT COUNT(*) as count FROM events WHERE session_id = ?';
    let query = 'SELECT * FROM events WHERE session_id = ?';
    const params: (string | number)[] = [sessionId];
    const countParams: (string | number)[] = [sessionId];

    if (type) {
      query += ' AND event_type = ?';
      countQuery += ' AND event_type = ?';
      params.push(type);
      countParams.push(type);
    }
    if (toolName) {
      query += ' AND tool_name = ?';
      countQuery += ' AND tool_name = ?';
      params.push(toolName);
      countParams.push(toolName);
    }

    // SQLite COUNT(*) always returns { count: number } for this query shape
    const totalRow = db.prepare(countQuery).get(...countParams) as { count: number };

    query += ' ORDER BY timestamp ASC LIMIT ?';
    params.push(limit);

    // Rows match the EventRow interface defined above for the events table
    const rows = db.prepare(query).all(...params) as EventRow[];

    const events = rows.map((row) => {
      let payload: Record<string, unknown> | null = null;
      if (row.payload) {
        try { payload = JSON.parse(row.payload); } catch { /* keep null */ }
      }
      return {
        id: row.id,
        sessionId: row.session_id,
        timestamp: row.timestamp,
        eventType: row.event_type,
        toolName: row.tool_name,
        success: row.success === null ? null : row.success === 1,
        durationMs: row.duration_ms,
        promptId: row.prompt_id,
        payload,
      };
    });

    return agentResponse(events, {
      total: totalRow.count,
      returned: events.length,
      schema: '/api/agent/schemas/HookEvent',
      related: {
        timeline: `/api/agent/timeline?sessionId=${sessionId}`,
        failures: `/api/agent/failures?sessionId=${sessionId}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'events', 500);
  }
}
