import { type NextRequest } from 'next/server';
import { agentResponse, agentError } from '../_lib/response';

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
  if (!row.result) return [];
  try {
    let parsed: unknown = JSON.parse(row.result);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'rawOutput' in (parsed as Record<string, unknown>)
    ) {
      const raw = (parsed as { rawOutput: string }).rawOutput;
      const fenceMatch = raw.match(/^[\s\n]*```(?:json)?\s*\n([\s\S]*)\n```[\s\n]*$/);
      const content = fenceMatch ? fenceMatch[1] : raw.trim();
      try {
        parsed = JSON.parse(content);
      } catch {
        /* keep as-is */
      }
    }
    const obj = parsed as { failures?: Failure[] };
    return obj.failures ?? [];
  } catch {
    return [];
  }
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
      .get(sessionId) as AnalysisRow | undefined;

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
