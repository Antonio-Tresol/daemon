import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const event = {
      id: crypto.randomUUID(),
      sessionId: body.session_id ?? body.sessionId ?? 'unknown',
      timestamp: body.event?.timestamp ?? new Date().toISOString(),
      eventType: body.hook_event_name ?? body.event?.name ?? body.eventType ?? 'unknown',
      toolName: body.tool_name ?? body.tool_input?.tool_name ?? null,
      success: body.success === 'true' || body.success === true ? true : body.success === 'false' || body.success === false ? false : null,
      durationMs: body.duration_ms ? Number(body.duration_ms) : null,
      promptId: body.prompt_id ?? null,
      payload: body,
    };

    // Dynamic import to avoid loading infra at module level
    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    // Upsert session BEFORE inserting event (FK constraint)
    db.prepare(`
      INSERT OR IGNORE INTO sessions (id, start_time, status, cwd)
      VALUES (?, ?, 'active', ?)
    `).run(event.sessionId, event.timestamp, body.cwd ?? null);

    if (event.eventType === 'SessionEnd') {
      db.prepare(`
        UPDATE sessions SET end_time = ?, status = 'completed' WHERE id = ?
      `).run(event.timestamp, event.sessionId);
    }

    // Update event count
    db.prepare(`
      UPDATE sessions SET total_events = total_events + 1 WHERE id = ?
    `).run(event.sessionId);

    db.prepare(`
      INSERT INTO events (id, session_id, timestamp, event_type, tool_name, success, duration_ms, prompt_id, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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

    return NextResponse.json({ ok: true, eventId: event.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const eventType = searchParams.get('eventType');
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500);
    const offset = Number(searchParams.get('offset') ?? 0);

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    let query = 'SELECT * FROM events WHERE 1=1';
    const params: (string | number)[] = [];

    if (sessionId) {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }
    if (eventType) {
      query += ' AND event_type = ?';
      params.push(eventType);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params);

    const events = (rows as Array<Record<string, unknown>>).map((row) => ({ // .all() returns unknown[]
      ...row,
      success: row.success === null ? null : row.success === 1,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    }));

    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
