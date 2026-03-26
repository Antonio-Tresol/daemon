import { type NextRequest, NextResponse } from 'next/server';
import {
  ANALYSIS_TYPES,
  type AnalysisType,
  isValidAnalysisType,
} from '@/server/domain/analysis/analysis.entity';
import { RunAnalysisUseCase } from '@/server/application/run-analysis.use-case';
import { SqliteAnalysisRepository } from '@/server/infrastructure/db/analysis.sqlite-repo';
import { SqliteEventRepository } from '@/server/infrastructure/db/event.sqlite-repo';
import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';
import { AgentSdkClaudeRunner } from '@/server/infrastructure/agent-sdk-claude-runner';
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
    const eventRepo = new SqliteEventRepository();
    const claudeRunner = new AgentSdkClaudeRunner();
    const useCase = new RunAnalysisUseCase(analysisRepo, eventRepo, claudeRunner);

    const validLevel = typeof level === 'number' ? level : 0;

    const analysis = await useCase.execute(sessionId, type as AnalysisType, validLevel);

    return NextResponse.json(
      {
        data: {
          id: analysis.id,
          sessionId,
          analysisType: type,
          status: analysis.status,
          level: validLevel,
          triggeredAt: analysis.triggeredAt,
          completedAt: analysis.completedAt,
          error: analysis.error,
        },
        _meta: {
          total: 1,
          returned: 1,
          schema: '/api/agent/schemas/AnalysisResult',
          related: {
            poll: `/api/agent/analysis/${analysis.id}`,
            session: `/api/agent/sessions?status=completed`,
          },
          suggestions: [`View result: GET /api/agent/analysis/${analysis.id}`],
        },
      },
      { status: analysis.status === 'completed' ? 200 : 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'analyze', 500);
  }
}
