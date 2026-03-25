import { NextRequest, NextResponse } from 'next/server';

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
    const body = await request.json() as { name?: string; groupLabel?: string }; // request.json() returns unknown

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    // Verify session exists
    const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(id) as { id: string } | undefined; // .get() returns unknown
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'No fields to update. Provide name or groupLabel.' }, { status: 400 });
    }

    values.push(id);
    db.prepare(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`).run(...values);

    // Return updated session
    const updated = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow; // .get() returns unknown

    return NextResponse.json({ session: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    const session = db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.id) as total_events,
        (SELECT COALESCE(SUM(
          CASE WHEN json_extract(e.payload, '$.cost_usd') IS NOT NULL
          THEN CAST(json_extract(e.payload, '$.cost_usd') AS REAL)
          ELSE 0 END
        ), 0) FROM events e WHERE e.session_id = s.id) as total_cost_usd
      FROM sessions s WHERE s.id = ?
    `).get(id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const events = db.prepare(
      'SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC',
    ).all(id);

    const parsedEvents = (events as Array<Record<string, unknown>>).map((row) => ({ // .all() returns unknown[]
      ...row,
      success: row.success === null ? null : row.success === 1,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    }));

    return NextResponse.json({ session, events: parsedEvents });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
