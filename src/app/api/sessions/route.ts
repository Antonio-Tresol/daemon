import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const group = searchParams.get('group');
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    let query = `
      SELECT s.*,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.id) as total_events,
        (SELECT COALESCE(SUM(
          CASE WHEN json_extract(e.payload, '$.cost_usd') IS NOT NULL
          THEN CAST(json_extract(e.payload, '$.cost_usd') AS REAL)
          ELSE 0 END
        ), 0) FROM events e WHERE e.session_id = s.id) as total_cost_usd
      FROM sessions s WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    if (group) {
      query += ' AND s.group_label = ?';
      params.push(group);
    }

    query += ' ORDER BY s.start_time DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(query).all(...params);

    return NextResponse.json({ sessions: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
