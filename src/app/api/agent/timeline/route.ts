import { type NextRequest } from 'next/server';
import { agentResponse, agentError } from '../_lib/response';
import { parseAnalysisJson } from '@/shared/lib/parse-json';

interface AnalysisRow {
  id: string;
  session_id: string;
  analysis_type: string;
  triggered_at: string;
  completed_at: string | null;
  status: string;
  result: string | null;
  error: string | null;
}

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

function parseResult(row: AnalysisRow): { plans?: TimelinePlan[] } | null {
  return parseAnalysisJson<{ plans?: TimelinePlan[] }>(row.result);
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

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    const row = db
      .prepare(
        "SELECT * FROM analyses WHERE session_id = ? AND analysis_type = 'timeline' AND status = 'completed' ORDER BY triggered_at DESC LIMIT 1",
      )
      .get(sessionId) as AnalysisRow | undefined; // .get() returns unknown

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
