import { type NextRequest, NextResponse } from 'next/server';
import { type AnalysisType, isValidAnalysisType } from '@/server/domain/analysis/analysis.entity';
import { autoNameSession } from '@/server/infrastructure/auto-name-session';
import { buildEventSummary } from '@/server/infrastructure/build-event-summary';
import { SqliteAnalysisRepository } from '@/server/infrastructure/db/analysis.sqlite-repo';
import { SqliteEventRepository } from '@/server/infrastructure/db/event.sqlite-repo';
import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';
import {
  buildAgentPrompt,
  readPromptTemplate,
  runClaudeAgent,
} from '@/server/infrastructure/run-agent-analysis';
import { extractJson, unwrapRawOutput } from '@/shared/lib/parse-json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const typeParam = searchParams.get('type');
    const type = typeParam && isValidAnalysisType(typeParam) ? typeParam : null;
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);

    const level = searchParams.get('level');
    const parsedLevel = level !== null ? Number(level) : undefined;

    const analysisRepo = new SqliteAnalysisRepository();
    const rows = analysisRepo.findPaginated({
      sessionId,
      analysisType: type,
      level: parsedLevel !== undefined && !Number.isNaN(parsedLevel) ? parsedLevel : undefined,
      limit,
    });

    const analyses = rows.map((row) => {
      const result = unwrapRawOutput(
        typeof row.result === 'string' ? JSON.parse(row.result) : row.result,
      );
      return { ...row, result };
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      type,
      level: requestLevel,
    } = (await request.json()) as {
      sessionId: string;
      type: AnalysisType;
      level?: number;
    };
    const level = typeof requestLevel === 'number' ? requestLevel : 0;

    if (!sessionId || !type || !isValidAnalysisType(type)) {
      return NextResponse.json(
        { error: 'Valid sessionId and type (timeline|failures|improvements) required' },
        { status: 400 },
      );
    }

    const sessionRepo = new SqliteSessionRepository();
    const eventRepo = new SqliteEventRepository();
    const analysisRepo = new SqliteAnalysisRepository();

    const sessionRow = sessionRepo.findById(sessionId);
    const eventCount = eventRepo.countBySessionId(sessionId);

    if (!sessionRow && eventCount === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (level > 0) {
      const prevRow = analysisRepo.findBySessionIdAndLevel(sessionId, type, level - 1);
      if (!prevRow) {
        return NextResponse.json(
          {
            error: `No completed Level ${level - 1} analysis found. Run Level ${level - 1} first.`,
          },
          { status: 404 },
        );
      }
    }

    const analysisId = crypto.randomUUID();
    const triggeredAt = new Date().toISOString();

    analysisRepo.save({
      id: analysisId,
      sessionId,
      analysisType: type,
      level,
      triggeredAt,
      completedAt: null,
      status: 'running',
      result: null,
      error: null,
    });

    const promptTemplate = await readPromptTemplate(type, level);
    const apiBase = new URL('/api/agent', request.url).toString();
    const eventSummary = level === 0 ? buildEventSummary(eventRepo, sessionId) : '';
    const agentPrompt = buildAgentPrompt(
      promptTemplate,
      sessionId,
      type,
      level,
      eventCount,
      apiBase,
      analysisId,
      eventSummary,
    );

    try {
      const { structured, raw } = await runClaudeAgent(agentPrompt, type);

      const updatedRow = analysisRepo.findById(analysisId);

      if (updatedRow?.status === 'completed' && updatedRow.result) {
        let result: unknown;
        try {
          result = unwrapRawOutput(
            typeof updatedRow.result === 'string'
              ? JSON.parse(updatedRow.result)
              : updatedRow.result,
          );
        } catch {
          result = { rawOutput: updatedRow.result };
        }

        if (type === 'timeline' && level === 0) {
          autoNameSession(sessionRepo, sessionId, result);
        }

        return NextResponse.json({ ok: true, analysisId, result, source: 'api_submit' });
      }

      if (structured && typeof structured === 'object') {
        analysisRepo.update({
          ...updatedRow!,
          completedAt: new Date().toISOString(),
          status: 'completed',
          result: structured as Record<string, unknown>, // structured is unknown from SDK; narrowed by typeof check above
        });

        if (type === 'timeline' && level === 0) {
          autoNameSession(sessionRepo, sessionId, structured);
        }

        return NextResponse.json({
          ok: true,
          analysisId,
          result: structured,
          source: 'structured_output',
        });
      }

      let result: unknown;
      const extracted = extractJson(raw);
      result = extracted ?? { rawOutput: raw };

      analysisRepo.update({
        ...updatedRow!,
        completedAt: new Date().toISOString(),
        status: 'completed',
        result: result as Record<string, unknown>, // extractJson returns unknown; narrowed by null check above
      });

      if (type === 'timeline' && level === 0) {
        autoNameSession(sessionRepo, sessionId, result);
      }

      return NextResponse.json({ ok: true, analysisId, result, source: 'text_fallback' });
    } catch (analysisError) {
      const lastCheck = analysisRepo.findById(analysisId);

      if (lastCheck?.status === 'completed' && lastCheck.result) {
        let result: unknown;
        try {
          result = unwrapRawOutput(
            typeof lastCheck.result === 'string' ? JSON.parse(lastCheck.result) : lastCheck.result,
          );
        } catch {
          result = { rawOutput: lastCheck.result };
        }
        return NextResponse.json({ ok: true, analysisId, result, source: 'api_submit' });
      }

      const errMsg = analysisError instanceof Error ? analysisError.message : 'Analysis failed';
      analysisRepo.update({
        ...lastCheck!,
        completedAt: new Date().toISOString(),
        status: 'failed',
        error: errMsg,
      });

      return NextResponse.json({ ok: false, analysisId, error: errMsg }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
