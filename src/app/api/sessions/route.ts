import { type NextRequest, NextResponse } from 'next/server';
import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const group = searchParams.get('group');
    // limit is ignored in current repository findAll, could add it but let's just filter in memory for now, or add to repo.
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

    const sessionRepo = new SqliteSessionRepository();
    // Since we need status and group filters:
    let sessions = [];

    if (group) {
      sessions = sessionRepo.findByGroup(group);
      if (status) sessions = sessions.filter((s) => s.status === status);
    } else if (status === 'active') {
      sessions = sessionRepo.findActive();
    } else {
      sessions = sessionRepo.findAll();
      if (status) sessions = sessions.filter((s) => s.status === status);
    }

    sessions = sessions.slice(0, limit);

    return NextResponse.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
