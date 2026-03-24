import { type NextRequest } from 'next/server';
import { agentResponse, agentError } from '../_lib/response';

interface AnalysisRow {
  result: string | null;
}

interface Improvement {
  area: string;
  problem: string;
  suggestion: string;
  config: Record<string, unknown> | null;
  severity: string;
  effort: string;
  category: string;
}

function parseImprovements(row: AnalysisRow): Improvement[] {
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
    const obj = parsed as { improvements?: Improvement[] };
    return obj.improvements ?? [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const area = searchParams.get('area');
    const severity = searchParams.get('severity');

    if (!sessionId) {
      return agentError(
        'sessionId query parameter is required',
        'MISSING_PARAM',
        'Provide ?sessionId=<id>. List sessions at GET /api/agent/sessions',
        'improvements',
      );
    }

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    const row = db
      .prepare(
        "SELECT result FROM analyses WHERE session_id = ? AND analysis_type = 'improvements' AND status = 'completed' ORDER BY triggered_at DESC LIMIT 1",
      )
      .get(sessionId) as AnalysisRow | undefined;

    if (!row) {
      return agentResponse([], {
        total: 0,
        returned: 0,
        schema: '/api/agent/schemas/Improvement',
        related: { analyze: '/api/agent/analyze' },
        suggestions: [
          'No improvement analysis found. Trigger one: POST /api/agent/analyze {"sessionId":"' +
            sessionId +
            '","type":"improvements"}',
        ],
      });
    }

    let improvements = parseImprovements(row);

    if (area) {
      const areaLower = area.toLowerCase();
      improvements = improvements.filter((i) => i.area.toLowerCase() === areaLower);
    }
    if (severity) {
      const sevLower = severity.toLowerCase();
      improvements = improvements.filter((i) => i.severity.toLowerCase() === sevLower);
    }

    const mapped = improvements.map((i) => ({
      ...i,
      config: i.config ? JSON.stringify(i.config) : null,
    }));

    return agentResponse(mapped, {
      total: mapped.length,
      returned: mapped.length,
      schema: '/api/agent/schemas/Improvement',
      related: {
        failures: `/api/agent/failures?sessionId=${sessionId}`,
        timeline: `/api/agent/timeline?sessionId=${sessionId}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'improvements', 500);
  }
}
