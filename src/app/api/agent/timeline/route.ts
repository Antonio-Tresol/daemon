import type { NextRequest } from 'next/server';
import type { AnalysisResult } from '@/server/domain/analysis/analysis.entity';
import { SqliteAnalysisRepository } from '@/server/infrastructure/db/analysis.sqlite-repo';
import { agentError, agentResponse } from '../_lib/response';

interface TimelinePlan {
  name: string;
  phase: string;
  tasks: Array<{
    name: string;
    status: string;
    eventIds: string[];
    startTime: string;
    endTime: string | null;
  }>;
}

function parseResult(row: AnalysisResult): { plans?: TimelinePlan[] } | null {
  return (row.result as { plans?: TimelinePlan[] }) ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return agentError(
        'sessionId query parameter is required',
        'MISSING_PARAM',
        'Provide ?sessionId=<id>. List sessions at GET /api/agent/sessions',
        'timeline',
      );
    }

    const analysisRepo = new SqliteAnalysisRepository();
    const rows = analysisRepo.findPaginated({ sessionId, analysisType: 'timeline', limit: 5 });
    const row = rows.find((r) => r.status === 'completed');

    if (!row) {
      return agentResponse([], {
        total: 0,
        returned: 0,
        schema: '/api/agent/schemas/TimelinePlan',
        related: {
          analyze: `/api/agent/analyze`,
        },
        suggestions: [
          'No timeline analysis found. Trigger one: POST /api/agent/analyze {"sessionId":"' +
            sessionId +
            '","type":"timeline"}',
        ],
      });
    }

    const result = parseResult(row);
    const plans = result?.plans ?? [];

    return agentResponse(plans, {
      total: plans.length,
      returned: plans.length,
      schema: '/api/agent/schemas/TimelinePlan',
      related: {
        failures: `/api/agent/failures?sessionId=${sessionId}`,
        improvements: `/api/agent/improvements?sessionId=${sessionId}`,
        events: `/api/agent/events?sessionId=${sessionId}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'timeline', 500);
  }
}
