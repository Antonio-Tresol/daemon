import type { NextRequest } from 'next/server';
import type { AnalysisResult } from '@/server/domain/analysis/analysis.entity';
import { SqliteAnalysisRepository } from '@/server/infrastructure/db/analysis.sqlite-repo';
import { agentError, agentResponse } from '../_lib/response';

interface Improvement {
  area: string;
  problem: string;
  suggestion: string;
  config: Record<string, unknown> | null;
  severity: string;
  effort: string;
  category: string;
}

function parseImprovements(row: AnalysisResult): Improvement[] {
  const parsed = row.result as { improvements?: Improvement[] };
  return parsed?.improvements ?? [];
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

    const analysisRepo = new SqliteAnalysisRepository();
    const rows = analysisRepo.findPaginated({ sessionId, analysisType: 'improvements', limit: 5 });
    const row = rows.find((r) => r.status === 'completed');

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
