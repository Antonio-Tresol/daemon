import { type NextRequest } from 'next/server';
import { agentResponse, agentError } from '../../_lib/response';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json() as { name?: string; groupLabel?: string };

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    // Verify session exists
    const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(id) as { id: string } | undefined;
    if (!existing) {
      return agentError('Session not found', 'NOT_FOUND', 'Check the session ID', 'sessions', 404);
    }

    // Build dynamic update
    const sets: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) {
      sets.push('name = ?');
      values.push(body.name);
    }
    if (body.groupLabel !== undefined) {
      sets.push('group_label = ?');
      values.push(body.groupLabel);
    }

    if (sets.length === 0) {
      return agentError(
        'No fields to update. Provide name or groupLabel.',
        'VALIDATION_ERROR',
        'Include name and/or groupLabel in request body',
        'sessions',
        400,
      );
    }

    values.push(id);
    db.prepare(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`).run(...values);

    // Return updated session
    const updated = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow;

    const session = {
      id: updated.id,
      startTime: updated.start_time,
      endTime: updated.end_time,
      status: updated.status,
      cwd: updated.cwd,
      name: updated.name,
      groupLabel: updated.group_label,
      totalEvents: updated.total_events,
      totalCostUsd: updated.total_cost_usd,
    };

    return agentResponse(session, {
      total: 1,
      returned: 1,
      schema: '/api/agent/schemas/Session',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'sessions', 500);
  }
}
