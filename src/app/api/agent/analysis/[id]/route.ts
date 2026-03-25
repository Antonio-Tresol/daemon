import { type NextRequest, NextResponse } from 'next/server';
import { SqliteAnalysisRepository } from '@/server/infrastructure/db/analysis.sqlite-repo';
import { unwrapRawOutput } from '@/shared/lib/parse-json';
import { agentError } from '../../_lib/response';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const analysisRepo = new SqliteAnalysisRepository();
    const row = analysisRepo.findById(id);

    if (!row) {
      return agentError(
        `Analysis ${id} not found`,
        'NOT_FOUND',
        'Check the ID or list analyses for a session',
        'analysis',
        404,
      );
    }

    const parsedResult = unwrapRawOutput(row.result);

    const analysis = {
      id: row.id,
      sessionId: row.sessionId,
      analysisType: row.analysisType,
      status: row.status,
      level: row.level,
      triggeredAt: row.triggeredAt,
      completedAt: row.completedAt,
      result: parsedResult,
      error: row.error,
    };

    const suggestions: string[] = [];
    if (row.status === 'pending' || row.status === 'running') {
      suggestions.push(`Analysis still ${row.status}. Poll again shortly.`);
    }
    if (row.status === 'completed') {
      suggestions.push(`View related: GET /api/agent/failures?sessionId=${row.sessionId}`);
    }

    return NextResponse.json({
      data: analysis,
      _meta: {
        total: 1,
        returned: 1,
        schema: '/api/agent/schemas/AnalysisResult',
        related: {
          session: `/api/agent/sessions`,
          failures: `/api/agent/failures?sessionId=${row.sessionId}`,
          improvements: `/api/agent/improvements?sessionId=${row.sessionId}`,
        },
        suggestions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'analysis', 500);
  }
}
