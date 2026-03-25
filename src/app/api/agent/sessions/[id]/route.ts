import type { NextRequest } from 'next/server';
import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';
import { agentError, agentResponse } from '../../_lib/response';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { name?: string; groupLabel?: string };

    const sessionRepo = new SqliteSessionRepository();

    const existing = sessionRepo.findById(id);
    if (!existing) {
      return agentError('Session not found', 'NOT_FOUND', 'Check the session ID', 'sessions', 404);
    }

    let hasUpdate = false;
    if (body.name !== undefined) {
      sessionRepo.updateName(id, body.name);
      hasUpdate = true;
    }
    if (body.groupLabel !== undefined) {
      sessionRepo.updateGroup(id, body.groupLabel);
      hasUpdate = true;
    }

    if (!hasUpdate) {
      return agentError(
        'No fields to update. Provide name or groupLabel.',
        'VALIDATION_ERROR',
        'Include name and/or groupLabel in request body',
        'sessions',
        400,
      );
    }

    const updated = sessionRepo.findById(id);

    return agentResponse(updated, {
      total: 1,
      returned: 1,
      schema: '/api/agent/schemas/Session',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'sessions', 500);
  }
}
