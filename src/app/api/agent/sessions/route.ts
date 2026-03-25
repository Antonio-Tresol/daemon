import type { NextRequest } from 'next/server';
import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';
import { agentError, agentResponse } from '../_lib/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const group = searchParams.get('group');
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

    const sessionRepo = new SqliteSessionRepository();

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

    const total = sessions.length;
    sessions = sessions.slice(0, limit);

    return agentResponse(sessions, {
      total,
      returned: sessions.length,
      schema: '/api/agent/schemas/Session',
      suggestions:
        sessions.length > 0
          ? [`Try: GET /api/agent/timeline?sessionId=${sessions[0].id}`]
          : ['No sessions found. Start a Claude Code session with hooks enabled.'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'sessions', 500);
  }
}
