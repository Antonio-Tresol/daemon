import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

type AnalysisType = 'timeline' | 'failures' | 'improvements';

const VALID_TYPES: AnalysisType[] = ['timeline', 'failures', 'improvements'];

const PROMPT_FILES: Record<AnalysisType, string> = {
  timeline: 'analyze-session.md',
  failures: 'detect-failures.md',
  improvements: 'suggest-improvements.md',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type') as AnalysisType | null;
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    let query = 'SELECT * FROM analyses WHERE 1=1';
    const params: (string | number)[] = [];

    if (sessionId) {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }
    if (type && VALID_TYPES.includes(type)) {
      query += ' AND analysis_type = ?';
      params.push(type);
    }

    query += ' ORDER BY triggered_at DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(query).all(...params);
    const analyses = (rows as Array<Record<string, unknown>>).map((row) => {
      let result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result;

      // If result contains rawOutput with markdown code fences, parse it
      if (result && typeof result === 'object' && 'rawOutput' in result) {
        const raw = (result as { rawOutput: string }).rawOutput;
        const stripped = raw.replace(/^[\s\S]*?```(?:json)?\s*\n?/m, '').replace(/\n?```[\s\S]*$/m, '').trim();
        try {
          result = JSON.parse(stripped);
        } catch {
          // keep rawOutput as-is
        }
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
    const { sessionId, type } = await request.json();

    if (!sessionId || !type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Valid sessionId and type (timeline|failures|improvements) required' },
        { status: 400 },
      );
    }

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    // Fetch events for the session
    const events = db.prepare(
      'SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC',
    ).all(sessionId);

    if (!events || (events as Array<unknown>).length === 0) {
      return NextResponse.json({ error: 'No events found for session' }, { status: 404 });
    }

    // Create analysis record
    const analysisId = crypto.randomUUID();
    const triggeredAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO analyses (id, session_id, analysis_type, triggered_at, status)
      VALUES (?, ?, ?, ?, 'running')
    `).run(analysisId, sessionId, type, triggeredAt);

    // Read prompt template
    const promptPath = join(process.cwd(), 'src', 'prompts', PROMPT_FILES[type as AnalysisType]);
    let promptTemplate: string;
    try {
      promptTemplate = await readFile(promptPath, 'utf-8');
    } catch {
      promptTemplate = `Analyze the following Claude Code session events and produce a ${type} analysis as JSON.`;
    }

    const serializedEvents = JSON.stringify(events, null, 2);
    const fullPrompt = `${promptTemplate}\n\n<session-data>\n${serializedEvents}\n</session-data>`;

    // Run analysis via Claude CLI — write prompt to temp file to avoid arg length limits
    try {
      const tmpFile = join(tmpdir(), `ccc-analysis-${analysisId}.txt`);
      await writeFile(tmpFile, fullPrompt, 'utf-8');

      const stdout = await new Promise<string>((promiseResolve, promiseReject) => {
        const chunks: Buffer[] = [];
        const errChunks: Buffer[] = [];

        // Use shell to read from file: claude -p "$(cat tmpfile)"
        const child = spawn('claude', [
          '-p', '-',
          '--output-format', 'json',
        ], {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 300_000,
          shell: false,
        });

        child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
        child.stderr.on('data', (chunk: Buffer) => errChunks.push(chunk));

        child.on('close', (code) => {
          unlink(tmpFile).catch(() => { /* ignore */ });
          const output = Buffer.concat(chunks).toString('utf-8');
          if (code === 0 || output.length > 0) {
            promiseResolve(output);
          } else {
            promiseReject(new Error(Buffer.concat(errChunks).toString('utf-8') || `claude exited with code ${code}`));
          }
        });

        child.on('error', (err) => {
          unlink(tmpFile).catch(() => { /* ignore */ });
          promiseReject(err);
        });

        // Write prompt to stdin and close
        child.stdin.write(fullPrompt);
        child.stdin.end();
      });

      let result: unknown;
      try {
        const parsed = JSON.parse(stdout);
        // Claude --output-format json wraps result in { result: "...", ... }
        let resultText = typeof parsed.result === 'string' ? parsed.result : stdout;

        // Strip markdown code fences (```json ... ```)
        resultText = resultText.replace(/^[\s\S]*?```(?:json)?\s*\n?/m, '').replace(/\n?```[\s\S]*$/m, '').trim();

        try {
          result = JSON.parse(resultText);
        } catch {
          // If still not valid JSON, try the raw result
          result = typeof parsed.result === 'string' ? { rawOutput: parsed.result } : parsed;
        }
      } catch {
        result = { rawOutput: stdout };
      }

      db.prepare(`
        UPDATE analyses SET completed_at = ?, status = 'completed', result = ? WHERE id = ?
      `).run(new Date().toISOString(), JSON.stringify(result), analysisId);

      return NextResponse.json({ ok: true, analysisId, result });
    } catch (analysisError) {
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
