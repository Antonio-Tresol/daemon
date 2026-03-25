import { type NextRequest, NextResponse } from 'next/server';
import { IngestEventUseCase } from '@/server/application/ingest-event.use-case';
import { SqliteEventRepository } from '@/server/infrastructure/db/event.sqlite-repo';
import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input = {
      sessionId: body.session_id ?? body.sessionId ?? 'unknown',
      timestamp: body.event?.timestamp ?? new Date().toISOString(),
      eventType: body.hook_event_name ?? body.event?.name ?? body.eventType ?? 'unknown',
      toolName: body.tool_name ?? body.tool_input?.tool_name ?? null,
      success:
        body.success === 'true' || body.success === true
          ? true
          : body.success === 'false' || body.success === false
            ? false
            : null,
      durationMs: body.duration_ms ? Number(body.duration_ms) : null,
      promptId: body.prompt_id ?? null,
      payload: body,
      cwd: body.cwd ?? null,
    };

    const eventRepo = new SqliteEventRepository();
    const sessionRepo = new SqliteSessionRepository();
    const useCase = new IngestEventUseCase(eventRepo, sessionRepo);

    const event = useCase.execute(input);

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

    const eventRepo = new SqliteEventRepository();
    const events = eventRepo.findPaginated({ sessionId, eventType, limit, offset });

    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
