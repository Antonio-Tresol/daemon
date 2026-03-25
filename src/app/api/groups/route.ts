import { NextResponse } from 'next/server';
import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';

export async function GET() {
  try {
    const sessionRepo = new SqliteSessionRepository();
    const groups = sessionRepo.findGroups();

    return NextResponse.json({ groups });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
