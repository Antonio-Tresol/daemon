import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    const rows = db.prepare(
      'SELECT DISTINCT group_label FROM sessions WHERE group_label IS NOT NULL ORDER BY group_label ASC',
    ).all() as Array<{ group_label: string }>;

    const groups = rows.map((r) => r.group_label);

    return NextResponse.json({ groups });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
