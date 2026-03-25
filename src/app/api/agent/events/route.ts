import type { NextRequest } from 'next/server';
import { SqliteEventRepository } from '@/server/infrastructure/db/event.sqlite-repo';
import { agentError, agentResponse } from '../_lib/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type');
    const toolName = searchParams.get('toolName');
    const limit = Math.min(Number(searchParams.get('limit') ?? 200), 500);

    if (!sessionId) {
      return agentError(
        'sessionId query parameter is required',
        'MISSING_PARAM',
        'Provide ?sessionId=<id>. List sessions at GET /api/agent/sessions',
        'events',
      );
    }

    const eventRepo = new SqliteEventRepository();

    const events = eventRepo.findPaginated({
      sessionId,
      eventType: type,
      toolName,
      limit,
      offset: 0,
    });

    return agentResponse(events, {
      total: eventRepo.countBySessionId(sessionId),
      returned: events.length,
      schema: '/api/agent/schemas/HookEvent',
      related: {
        timeline: `/api/agent/timeline?sessionId=${sessionId}`,
        failures: `/api/agent/failures?sessionId=${sessionId}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'events', 500);
  }
}
