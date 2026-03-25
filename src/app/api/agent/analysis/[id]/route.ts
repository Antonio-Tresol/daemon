import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { agentError } from '../../_lib/response';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    const row = db
      .prepare('SELECT * FROM analyses WHERE id = ?')
      .get(id) as AnalysisRow | undefined; // .get() returns unknown

    if (!row) {
      return agentError(
        `Analysis ${id} not found`,
        'NOT_FOUND',
        'Check the ID or list analyses for a session',
        'analysis',
        404,
      );
    }

    let parsedResult: unknown = null;
    if (row.result) {
      try {
        parsedResult = JSON.parse(row.result);
        // Handle rawOutput wrapping
        if (
          parsedResult !== null &&
          typeof parsedResult === 'object' &&
          'rawOutput' in (parsedResult as Record<string, unknown>) // narrowing unknown for 'in' operator check
        ) {
          const raw = (parsedResult as { rawOutput: string }).rawOutput; // narrowing after 'in' check confirms rawOutput exists
          const fenceMatch = raw.match(
            /^[\s\n]*```(?:json)?\s*\n([\s\S]*)\n```[\s\n]*$/,
          );
          const content = fenceMatch ? fenceMatch[1] : raw.trim();
          try {
            parsedResult = JSON.parse(content);
          } catch {
            /* keep as-is */
          }
        }
      } catch {
        parsedResult = null;
      }
    }

    const analysis = {
      id: row.id,
      sessionId: row.session_id,
      analysisType: row.analysis_type,
      status: row.status,
      level: 0,
      triggeredAt: row.triggered_at,
      completedAt: row.completed_at,
      result: parsedResult,
      error: row.error,
    };

    const suggestions: string[] = [];
    if (row.status === 'pending' || row.status === 'running') {
      suggestions.push(`Analysis still ${row.status}. Poll again shortly.`);
    }
    if (row.status === 'completed') {
      suggestions.push(
        `View related: GET /api/agent/failures?sessionId=${row.session_id}`,
      );
    }

    return NextResponse.json({
      data: analysis,
      _meta: {
        total: 1,
        returned: 1,
        schema: '/api/agent/schemas/AnalysisResult',
        related: {
          session: `/api/agent/sessions`,
          failures: `/api/agent/failures?sessionId=${row.session_id}`,
          improvements: `/api/agent/improvements?sessionId=${row.session_id}`,
        },
        suggestions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'analysis', 500);
  }
}
