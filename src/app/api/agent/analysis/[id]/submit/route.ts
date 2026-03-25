import { type NextRequest, NextResponse } from 'next/server';
import { SqliteAnalysisRepository } from '@/server/infrastructure/db/analysis.sqlite-repo';
import { agentError } from '../../../_lib/response';

interface SubmitBody {
  result: unknown;
  status?: 'completed' | 'failed';
  error?: string;
  append?: boolean;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: analysisId } = await params;
    const body = (await request.json()) as SubmitBody; // request.json() returns unknown

    if (!body.result && body.status !== 'failed') {
      return agentError(
        'Request body must include a result object',
        'INVALID_BODY',
        'Submit JSON: {"result": {"plans": [...]}} or {"result": {"failures": [...]}} or {"result": {"improvements": [...]}}',
        'submit',
      );
    }

    const analysisRepo = new SqliteAnalysisRepository();
    const row = analysisRepo.findById(analysisId);

    if (!row) {
      return agentError(
        `Analysis ${analysisId} not found`,
        'NOT_FOUND',
        'Trigger analysis first via POST /api/agent/analyze, then use the returned id',
        'submit',
        404,
      );
    }

    const status = body.status ?? 'completed';
    const completedAt = new Date().toISOString();

    if (body.append && row.result) {
      // row.result is JSON from DB (unknown shape); body.result is unknown from request — narrowing for merge
      const existing = (row.result as Record<string, unknown>) ?? {};
      const incoming = body.result as Record<string, unknown>;

      const merged: Record<string, unknown> = { ...existing };
      for (const [key, value] of Object.entries(incoming)) {
        if (Array.isArray(value) && Array.isArray(existing[key])) {
          merged[key] = [...(existing[key] as unknown[]), ...value];
        } else {
          merged[key] = value;
        }
      }

      analysisRepo.update({
        ...row,
        status,
        completedAt,
        result: merged,
        error: body.error ?? null,
      });

      return NextResponse.json({
        data: {
          id: analysisId,
          status,
          merged: true,
          completedAt,
        },
        _meta: {
          total: 1,
          returned: 1,
          schema: '/api/agent/schemas/AnalysisResult',
          related: {
            view: `/api/agent/analysis/${analysisId}`,
            session: `/api/agent/sessions`,
          },
          suggestions: [
            `View result: GET /api/agent/analysis/${analysisId}`,
            'Submit more with append:true to incrementally build the analysis',
          ],
        },
      });
    }

    analysisRepo.update({
      ...row,
      status,
      completedAt,
      result: body.result as Record<string, unknown>, // body.result is unknown from request JSON
      error: body.error ?? null,
    });

    return NextResponse.json({
      data: {
        id: analysisId,
        status,
        completedAt,
      },
      _meta: {
        total: 1,
        returned: 1,
        schema: '/api/agent/schemas/AnalysisResult',
        related: {
          view: `/api/agent/analysis/${analysisId}`,
        },
        suggestions: [`View result: GET /api/agent/analysis/${analysisId}`],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'submit', 500);
  }
}
