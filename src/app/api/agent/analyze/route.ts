import { type NextRequest, NextResponse } from 'next/server';
import {
  ANALYSIS_TYPES,
  type AnalysisType,
  isValidAnalysisType,
} from '@/server/domain/analysis/analysis.entity';
import { SqliteAnalysisRepository } from '@/server/infrastructure/db/analysis.sqlite-repo';
import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';
import { agentError } from '../_lib/response';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (body === null || typeof body !== 'object' || !('sessionId' in body) || !('type' in body)) {
      return agentError(
        'Request body must include sessionId and type',
        'INVALID_BODY',
        'Send JSON: {"sessionId":"<id>","type":"timeline|failures|improvements","level":0}',
        'analyze',
      );
    }

    const {
      sessionId,
      type,
      level = 0,
    } = body as {
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

    const sessionRepo = new SqliteSessionRepository();
    const session = sessionRepo.findById(sessionId);

    if (!session) {
      return agentError(
        `Session ${sessionId} not found`,
        'NOT_FOUND',
        'List sessions at GET /api/agent/sessions',
        'analyze',
        404,
      );
    }

    const analysisRepo = new SqliteAnalysisRepository();
    const analysisId = crypto.randomUUID();
    const triggeredAt = new Date().toISOString();

    analysisRepo.save({
      id: analysisId,
      sessionId,
      analysisType: type as AnalysisType, // validated by isValidAnalysisType() guard above
      level: typeof level === 'number' ? level : 0,
      triggeredAt,
      completedAt: null,
      status: 'pending',
      result: null,
      error: null,
    });

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
          suggestions: [`Poll for results: GET /api/agent/analysis/${analysisId}`],
        },
      },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'analyze', 500);
  }
}
