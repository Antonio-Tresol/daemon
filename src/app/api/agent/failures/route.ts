import { type NextRequest } from 'next/server';
import { agentResponse, agentError } from '../_lib/response';
import { parseAnalysisJson } from '@/shared/lib/parse-json';

interface AnalysisRow {
  result: string | null;
}

interface Failure {
  timestamp: string;
  type: string;
  description: string;
  rootCause: string;
  impact: string;
  eventId: string | null;
}

function parseFailures(row: AnalysisRow): Failure[] {
  const parsed = parseAnalysisJson<{ failures?: Failure[] }>(row.result);
  return parsed?.failures ?? [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const impact = searchParams.get('impact');
    const type = searchParams.get('type');

    if (!sessionId) {
      return agentError(
        'sessionId query parameter is required',
        'MISSING_PARAM',
        'Provide ?sessionId=<id>. List sessions at GET /api/agent/sessions',
        'failures',
      );
    }

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    const row = db
      .prepare(
        "SELECT result FROM analyses WHERE session_id = ? AND analysis_type = 'failures' AND status = 'completed' ORDER BY triggered_at DESC LIMIT 1",
      )
      .get(sessionId) as AnalysisRow | undefined; // .get() returns unknown

    if (!row) {
      return agentResponse([], {
        total: 0,
        returned: 0,
        schema: '/api/agent/schemas/Failure',
        related: { analyze: '/api/agent/analyze' },
        suggestions: [
          'No failure analysis found. Trigger one: POST /api/agent/analyze {"sessionId":"' +
            sessionId +
            '","type":"failures"}',
        ],
      });
    }

    let failures = parseFailures(row);

    if (impact) {
      const impactLower = impact.toLowerCase();
      failures = failures.filter((f) => f.impact.toLowerCase() === impactLower);
    }
    if (type) {
      failures = failures.filter((f) => f.type === type);
    }

    return agentResponse(failures, {
      total: failures.length,
      returned: failures.length,
      schema: '/api/agent/schemas/Failure',
      related: {
        improvements: `/api/agent/improvements?sessionId=${sessionId}`,
        timeline: `/api/agent/timeline?sessionId=${sessionId}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'failures', 500);
  }
}
