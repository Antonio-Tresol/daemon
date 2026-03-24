import { type NextRequest, NextResponse } from 'next/server';
import { agentError } from '../../../_lib/response';

interface SubmitBody {
  result: unknown;
  status?: 'completed' | 'failed';
  error?: string;
  append?: boolean;
}

/**
 * POST /api/agent/analysis/:id/submit
 *
 * Lets the analysis agent submit results back to the Command Center.
 * The agent queries the API autonomously, builds its analysis, and POSTs the result here.
 *
 * Options:
 * - result: The analysis result (plans, failures, improvements)
 * - status: 'completed' (default) or 'failed'
 * - error: Error message if status is 'failed'
 * - append: If true, merge with existing result instead of replacing (for incremental submission)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: analysisId } = await params;
    const body = (await request.json()) as SubmitBody;

    if (!body.result && body.status !== 'failed') {
      return agentError(
        'Request body must include a result object',
        'INVALID_BODY',
        'Submit JSON: {"result": {"plans": [...]}} or {"result": {"failures": [...]}} or {"result": {"improvements": [...]}}',
        'submit',
      );
    }

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    // Find the analysis record
    const row = db
      .prepare('SELECT * FROM analyses WHERE id = ?')
      .get(analysisId) as Record<string, unknown> | undefined;

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
      // Merge with existing result
      let existing: Record<string, unknown> = {};
      try {
        existing =
          typeof row.result === 'string'
            ? (JSON.parse(row.result as string) as Record<string, unknown>)
            : (row.result as Record<string, unknown>);
      } catch {
        existing = {};
      }

      const incoming = body.result as Record<string, unknown>;

      // Merge arrays (plans, failures, improvements) by concatenating
      const merged: Record<string, unknown> = { ...existing };
      for (const [key, value] of Object.entries(incoming)) {
        if (Array.isArray(value) && Array.isArray(existing[key])) {
          merged[key] = [
            ...(existing[key] as unknown[]),
            ...value,
          ];
        } else {
          merged[key] = value;
        }
      }

      db.prepare(
        `UPDATE analyses SET completed_at = ?, status = ?, result = ?, error = ? WHERE id = ?`,
      ).run(completedAt, status, JSON.stringify(merged), body.error ?? null, analysisId);

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

    // Replace result entirely
    db.prepare(
      `UPDATE analyses SET completed_at = ?, status = ?, result = ?, error = ? WHERE id = ?`,
    ).run(
      completedAt,
      status,
      JSON.stringify(body.result),
      body.error ?? null,
      analysisId,
    );

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
        suggestions: [
          `View result: GET /api/agent/analysis/${analysisId}`,
        ],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'submit', 500);
  }
}
