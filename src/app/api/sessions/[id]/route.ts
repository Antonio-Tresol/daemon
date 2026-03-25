import { type NextRequest, NextResponse } from 'next/server';
import { SqliteEventRepository } from '@/server/infrastructure/db/event.sqlite-repo';
import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { name?: string; groupLabel?: string };

    const sessionRepo = new SqliteSessionRepository();

    const existing = sessionRepo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (body.name !== undefined) {
      sessionRepo.updateName(id, body.name);
    }
    if (body.groupLabel !== undefined) {
      sessionRepo.updateGroup(id, body.groupLabel);
    }

    if (body.name === undefined && body.groupLabel === undefined) {
      return NextResponse.json(
        { error: 'No fields to update. Provide name or groupLabel.' },
        { status: 400 },
      );
    }

    const updated = sessionRepo.findById(id);

    return NextResponse.json({ session: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const sessionRepo = new SqliteSessionRepository();
    const eventRepo = new SqliteEventRepository();

    const session = sessionRepo.findById(id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const events = eventRepo.findBySessionId(id);

    return NextResponse.json({ session, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
