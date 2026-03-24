import { NextRequest, NextResponse } from 'next/server';

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

    const parsedEvents = (events as Array<Record<string, unknown>>).map((row) => ({
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
