import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { agentError } from '../_lib/response';
import { ANALYSIS_TYPES, isValidAnalysisType } from '@/entities/analysis/analysis-types';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      body === null ||
      typeof body !== 'object' ||
      !('sessionId' in body) ||
      !('type' in body)
    ) {
      return agentError(
        'Request body must include sessionId and type',
        'INVALID_BODY',
        'Send JSON: {"sessionId":"<id>","type":"timeline|failures|improvements","level":0}',
        'analyze',
      );
    }

    // body validated as object with sessionId/type keys above
    const { sessionId, type, level = 0 } = body as {
      sessionId: string;
      type: string;
      level?: number;
    };

    if (!sessionId || typeof sessionId !== 'string') {
      return agentError(
        'sessionId must be a non-empty string',
        'INVALID_PARAM',
        'List sessions at GET /api/agent/sessions',
        'analyze',
      );
    }

    if (!isValidAnalysisType(type)) {
      return agentError(
        `type must be one of: ${ANALYSIS_TYPES.join(', ')}`,
        'INVALID_PARAM',
        'Valid types: timeline, failures, improvements',
        'analyze',
      );
    }

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    // Verify session exists
    const session = db
      .prepare('SELECT id FROM sessions WHERE id = ?')
      .get(sessionId) as { id: string } | undefined; // .get() returns unknown

    if (!session) {
      return agentError(
        `Session ${sessionId} not found`,
        'NOT_FOUND',
        'List sessions at GET /api/agent/sessions',
        'analyze',
        404,
      );
    }

    const analysisId = crypto.randomUUID();
    const triggeredAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO analyses (id, session_id, analysis_type, triggered_at, status) VALUES (?, ?, ?, ?, 'pending')`,
    ).run(analysisId, sessionId, type, triggeredAt);

    return NextResponse.json(
      {
        data: {
          id: analysisId,
          sessionId,
          analysisType: type,
          status: 'pending',
          level: typeof level === 'number' ? level : 0,
          triggeredAt,
          completedAt: null,
          error: null,
        },
        _meta: {
          total: 1,
          returned: 1,
          schema: '/api/agent/schemas/AnalysisResult',
          related: {
            poll: `/api/agent/analysis/${analysisId}`,
            session: `/api/agent/sessions?status=completed`,
          },
          suggestions: [
            `Poll for results: GET /api/agent/analysis/${analysisId}`,
          ],
        },
      },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'analyze', 500);
  }
}
