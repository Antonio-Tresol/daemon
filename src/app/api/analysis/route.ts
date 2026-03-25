import { NextRequest, NextResponse } from 'next/server';
import { extractJson } from '@/shared/lib/parse-json';
import { type AnalysisType, isValidAnalysisType } from '@/entities/analysis/analysis-types';
import { buildEventSummarySync } from '@/server/infrastructure/build-event-summary';
import { buildAgentPrompt, readPromptTemplate, runClaudeAgent } from '@/server/infrastructure/run-agent-analysis';
import { autoNameSession } from '@/server/infrastructure/auto-name-session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const typeParam = searchParams.get('type');
    const type = typeParam && isValidAnalysisType(typeParam) ? typeParam : null;
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    const level = searchParams.get('level');
    const parsedLevel = level !== null ? Number(level) : undefined;

    let query = 'SELECT * FROM analyses WHERE 1=1';
    const params: (string | number)[] = [];

    if (sessionId) {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }
    if (type) {
      query += ' AND analysis_type = ?';
      params.push(type);
    }
    if (parsedLevel !== undefined && !Number.isNaN(parsedLevel)) {
      query += ' AND level = ?';
      params.push(parsedLevel);
    }

    query += ' ORDER BY triggered_at DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(query).all(...params);
    const analyses = (rows as Array<Record<string, unknown>>).map((row) => { // .all() returns unknown[]
      let result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result;

      if (result && typeof result === 'object' && 'rawOutput' in result) {
        const raw = (result as { rawOutput: string }).rawOutput; // narrowing after 'in' check confirms rawOutput exists
        const parsed = extractJson(raw);
        if (parsed) result = parsed;
      }

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
    const { sessionId, type, level: requestLevel } = await request.json() as { // request.json() returns unknown
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

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    // Verify session exists and get event count
    const sessionRow = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Record<string, unknown> | undefined; // .get() returns unknown
    const eventCount = (db.prepare('SELECT COUNT(*) as count FROM events WHERE session_id = ?').get(sessionId) as { count: number })?.count ?? 0; // .get() returns unknown

    if (!sessionRow && eventCount === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // For level > 0, verify previous level exists
    if (level > 0) {
      const prevRow = db.prepare(
        "SELECT id FROM analyses WHERE session_id = ? AND analysis_type = ? AND level = ? AND status = 'completed' ORDER BY triggered_at DESC LIMIT 1",
      ).get(sessionId, type, level - 1) as Record<string, unknown> | undefined; // .get() returns unknown

      if (!prevRow) {
        return NextResponse.json(
          { error: `No completed Level ${level - 1} analysis found. Run Level ${level - 1} first.` },
          { status: 404 },
        );
      }
    }

    // Create analysis record
    const analysisId = crypto.randomUUID();
    const triggeredAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO analyses (id, session_id, analysis_type, level, triggered_at, status)
      VALUES (?, ?, ?, ?, ?, 'running')
    `).run(analysisId, sessionId, type, level, triggeredAt);

    // Read prompt template and build agent prompt
    const promptTemplate = await readPromptTemplate(type, level);
    const apiBase = 'http://localhost:3000/api/agent';
    const eventSummary = level === 0 ? buildEventSummarySync(db, sessionId) : '';
    const agentPrompt = buildAgentPrompt(promptTemplate, sessionId, type, level, eventCount, apiBase, analysisId, eventSummary);

    // Run analysis via Claude CLI
    try {
      const stdout = await runClaudeAgent(agentPrompt);

      // Check if the agent submitted results via the API (preferred path)
      const updatedRow = db.prepare('SELECT status, result FROM analyses WHERE id = ?')
        .get(analysisId) as { status: string; result: string | null } | undefined; // .get() returns unknown

      if (updatedRow?.status === 'completed' && updatedRow.result) {
        let result: unknown;
        try { result = JSON.parse(updatedRow.result); } catch { result = { rawOutput: updatedRow.result }; }

        if (type === 'timeline' && level === 0) {
          autoNameSession(db, sessionId, result);
        }

        return NextResponse.json({ ok: true, analysisId, result, submittedViaApi: true });
      }

      // Fallback: try to parse stdout if agent didn't use the submit endpoint
      let result: unknown;
      try {
        const parsed = JSON.parse(stdout);
        const resultText = typeof parsed.result === 'string' ? parsed.result : stdout;
        const extracted = extractJson(resultText);
        result = extracted ?? { rawOutput: resultText };
      } catch {
        const extracted = extractJson(stdout);
        result = extracted ?? { rawOutput: stdout };
      }

      db.prepare(`
        UPDATE analyses SET completed_at = ?, status = 'completed', result = ? WHERE id = ?
      `).run(new Date().toISOString(), JSON.stringify(result), analysisId);

      if (type === 'timeline' && level === 0) {
        autoNameSession(db, sessionId, result);
      }

      return NextResponse.json({ ok: true, analysisId, result, submittedViaApi: false });
    } catch (analysisError) {
      const lastCheck = db.prepare('SELECT status, result FROM analyses WHERE id = ?')
        .get(analysisId) as { status: string; result: string | null } | undefined; // .get() returns unknown

      if (lastCheck?.status === 'completed' && lastCheck.result) {
        let result: unknown;
        try { result = JSON.parse(lastCheck.result); } catch { result = { rawOutput: lastCheck.result }; }
        return NextResponse.json({ ok: true, analysisId, result, submittedViaApi: true });
      }

      const errMsg = analysisError instanceof Error ? analysisError.message : 'Analysis failed';
      db.prepare(`
        UPDATE analyses SET completed_at = ?, status = 'failed', error = ? WHERE id = ?
      `).run(new Date().toISOString(), errMsg, analysisId);

      return NextResponse.json({ ok: false, analysisId, error: errMsg }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
