import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

type AnalysisType = 'timeline' | 'failures' | 'improvements';

/** Build a compact event summary from the DB so the agent has a map without querying */
function buildEventSummary(sessionId: string, _apiBase: string): string {
  // Dynamic import not possible in sync function, so we use require-style
  // This runs server-side in Next.js API routes, so dynamic import is fine
  // We'll call this from the async context and pass results
  return `(Event summary will be injected at runtime)`;
}

/** Synchronously build the event summary given a DB instance */
function buildEventSummarySync(db: ReturnType<typeof import('@/server/infrastructure/db/sqlite').getDatabase>, sessionId: string): string {
  const events = db.prepare(
    'SELECT id, timestamp, event_type, tool_name, success, duration_ms FROM events WHERE session_id = ? ORDER BY timestamp ASC',
  ).all(sessionId) as Array<{
    id: string;
    timestamp: string;
    event_type: string;
    tool_name: string | null;
    success: number | null;
    duration_ms: number | null;
  }>;

  if (events.length === 0) return 'No events found.';

  // Build summary stats
  const byType: Record<string, number> = {};
  const byTool: Record<string, number> = {};
  const failures: Array<{ ts: string; tool: string | null; id: string }> = [];
  let firstTs = events[0].timestamp;
  let lastTs = events[events.length - 1].timestamp;

  for (const e of events) {
    byType[e.event_type] = (byType[e.event_type] ?? 0) + 1;
    if (e.tool_name) byTool[e.tool_name] = (byTool[e.tool_name] ?? 0) + 1;
    if (e.event_type === 'PostToolUseFailure' || e.success === 0) {
      failures.push({ ts: e.timestamp, tool: e.tool_name, id: e.id });
    }
  }

  // Build compact chronological sequence (tool names in order, grouped by 5-min windows)
  const windows: Array<{ start: string; tools: string[] }> = [];
  let currentWindow: { start: string; tools: string[] } | null = null;
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  for (const e of events) {
    if (!e.tool_name) continue;
    const ts = new Date(e.timestamp).getTime();
    if (!currentWindow || ts - new Date(currentWindow.start).getTime() > WINDOW_MS) {
      currentWindow = { start: e.timestamp, tools: [] };
      windows.push(currentWindow);
    }
    currentWindow.tools.push(e.tool_name);
  }

  const lines: string[] = [
    `## Event Summary`,
    ``,
    `**Total events**: ${events.length}`,
    `**Time range**: ${firstTs} to ${lastTs}`,
    `**Failures**: ${failures.length}`,
    ``,
    `### Events by type:`,
    ...Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, c]) => `- ${t}: ${c}`),
    ``,
    `### Events by tool:`,
    ...Object.entries(byTool).sort((a, b) => b[1] - a[1]).map(([t, c]) => `- ${t}: ${c}`),
    ``,
    `### Chronological sequence (5-min windows):`,
    ...windows.map((w, i) => `${i + 1}. [${w.start.slice(11, 19)}] ${w.tools.join(' → ')}`),
  ];

  if (failures.length > 0) {
    lines.push(``, `### Failures:`, ...failures.map(f => `- [${f.ts.slice(11, 19)}] ${f.tool ?? 'unknown'} (id: ${f.id})`));
  }

  return lines.join('\n');
}

/** Extract a JSON object from text that may contain explanation before/after the JSON */
function extractJson(raw: string): unknown | null {
  // Strategy 1: Entire string is JSON
  try { return JSON.parse(raw.trim()); } catch { /* continue */ }

  // Strategy 2: Code fence wrapping
  const fenceMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch { /* continue */ }
  }

  // Strategy 3: Find the first { and last } — extract the JSON object
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(raw.slice(firstBrace, lastBrace + 1)); } catch { /* continue */ }
  }

  return null;
}

const VALID_TYPES: AnalysisType[] = ['timeline', 'failures', 'improvements'];

const PROMPT_FILES: Record<AnalysisType, string> = {
  timeline: 'analyze-session.md',
  failures: 'detect-failures.md',
  improvements: 'suggest-improvements.md',
};

const META_PROMPT_FILE = 'meta-analysis.md';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type') as AnalysisType | null;
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
    if (type && VALID_TYPES.includes(type)) {
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
    const analyses = (rows as Array<Record<string, unknown>>).map((row) => {
      let result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result;

      if (result && typeof result === 'object' && 'rawOutput' in result) {
        const raw = (result as { rawOutput: string }).rawOutput;
        // Try multiple extraction strategies
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
    const { sessionId, type, level: requestLevel } = await request.json() as {
      sessionId: string;
      type: AnalysisType;
      level?: number;
    };
    const level = typeof requestLevel === 'number' ? requestLevel : 0;

    if (!sessionId || !type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Valid sessionId and type (timeline|failures|improvements) required' },
        { status: 400 },
      );
    }

    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    // Verify session exists and get event count
    const sessionRow = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Record<string, unknown> | undefined;
    const eventCount = (db.prepare('SELECT COUNT(*) as count FROM events WHERE session_id = ?').get(sessionId) as { count: number })?.count ?? 0;

    if (!sessionRow && eventCount === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // For level > 0, verify previous level exists
    if (level > 0) {
      const prevRow = db.prepare(
        "SELECT id FROM analyses WHERE session_id = ? AND analysis_type = ? AND level = ? AND status = 'completed' ORDER BY triggered_at DESC LIMIT 1",
      ).get(sessionId, type, level - 1) as Record<string, unknown> | undefined;

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

    // Read prompt template
    const promptFile = level > 0 ? META_PROMPT_FILE : PROMPT_FILES[type];
    const promptPath = join(process.cwd(), 'src', 'prompts', promptFile);
    let promptTemplate: string;
    try {
      promptTemplate = await readFile(promptPath, 'utf-8');
    } catch {
      promptTemplate = level > 0
        ? `Perform a meta-analysis (Level ${level}) on the Level ${level - 1} ${type} analysis.`
        : `Analyze the Claude Code session events and produce a ${type} analysis as JSON.`;
    }

    // Build the agent prompt — give it a summary + API access for drill-down
    const apiBase = 'http://localhost:3000/api/agent';
    const eventSummary = level === 0 ? buildEventSummarySync(db, sessionId) : '';
    const agentPrompt = buildAgentPrompt(promptTemplate, sessionId, type, level, eventCount, apiBase, analysisId, eventSummary);

    // Run analysis via Claude CLI with Bash tool so it can query our API
    try {
      const stdout = await runClaudeAgent(agentPrompt);

      // Check if the agent submitted results via the API (preferred path)
      const updatedRow = db.prepare('SELECT status, result FROM analyses WHERE id = ?')
        .get(analysisId) as { status: string; result: string | null } | undefined;

      if (updatedRow?.status === 'completed' && updatedRow.result) {
        // Agent submitted via API — result is already in DB
        let result: unknown;
        try { result = JSON.parse(updatedRow.result); } catch { result = { rawOutput: updatedRow.result }; }

        // Auto-name session after Level 0 timeline analysis
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

      // Auto-name session after Level 0 timeline analysis
      if (type === 'timeline' && level === 0) {
        autoNameSession(db, sessionId, result);
      }

      return NextResponse.json({ ok: true, analysisId, result, submittedViaApi: false });
    } catch (analysisError) {
      // Even if claude process failed, check if it managed to submit results before dying
      const lastCheck = db.prepare('SELECT status, result FROM analyses WHERE id = ?')
        .get(analysisId) as { status: string; result: string | null } | undefined;

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

/** After a Level 0 timeline analysis, auto-name the session with the first plan name if unnamed */
function autoNameSession(
  db: ReturnType<typeof import('@/server/infrastructure/db/sqlite').getDatabase>,
  sessionId: string,
  result: unknown,
): void {
  try {
    const session = db.prepare('SELECT name FROM sessions WHERE id = ?').get(sessionId) as { name: string | null } | undefined;
    if (session?.name) return; // already named

    // Extract first plan name from timeline result
    const plans = (result as Record<string, unknown> | null)?.plans;
    if (!Array.isArray(plans) || plans.length === 0) return;

    const firstPlan = plans[0] as Record<string, unknown>;
    const planName = typeof firstPlan.name === 'string' ? firstPlan.name : null;
    if (!planName) return;

    db.prepare('UPDATE sessions SET name = ? WHERE id = ?').run(planName, sessionId);
  } catch {
    // Non-critical — don't fail the analysis response
  }
}

function buildAgentPrompt(
  promptTemplate: string,
  sessionId: string,
  type: AnalysisType,
  level: number,
  eventCount: number,
  apiBase: string,
  analysisId: string,
  eventSummary: string = '',
): string {
  if (level > 0) {
    return `${promptTemplate}

## Your Mission

You are performing a Level ${level} meta-analysis on session \`${sessionId}\`.
Fetch the Level ${level - 1} analysis and synthesize it into a higher-level summary.

## API Access

Query the Command Center API to get the data you need:

\`\`\`bash
# Get the previous level's analysis
curl -s '${apiBase}/timeline?sessionId=${sessionId}&level=${level - 1}'
\`\`\`

## Submitting Results

When you have your analysis ready, submit it via the API:

\`\`\`bash
curl -s -X POST '${apiBase}/analysis/ANALYSIS_ID/submit' \\
  -H 'Content-Type: application/json' \\
  -d '{"result": YOUR_JSON_RESULT}'
\`\`\`

Your analysis ID is: \`${analysisId}\` — use it in the URL above.

## Output

After submitting via the API, output a brief summary. The structured result should be submitted via the API, not printed to stdout.`;
  }

  return `${promptTemplate}

## Your Mission

You are analyzing session \`${sessionId}\` which has **${eventCount} events**.

${eventSummary}

## API Access (for drill-down only)

You have access to the Command Center API at \`${apiBase}\` if you need more detail. Use curl + jq.

\`\`\`bash
# Filter events by type
curl -s '${apiBase}/events?sessionId=${sessionId}&type=PostToolUseFailure' | jq '.data'

# Filter by tool name
curl -s '${apiBase}/events?sessionId=${sessionId}&toolName=Edit' | jq '.data'
\`\`\`

## Instructions

1. Use the summary above as your primary data source
2. Only query the API if you need more detail on specific events
3. For ${type} analysis:
${type === 'timeline' ? '   - Group the chronological events into logical plans (high-level goals) and tasks\n   - Identify phases: research, scaffolding, implementation, testing, debugging, refinement\n   - Each plan has a name, phase, and tasks array' : ''}${type === 'failures' ? '   - Focus on PostToolUseFailure events\n   - Classify: tool_failure, api_error, permission_denied, logic_error, timeout\n   - Identify root causes and assess impact (critical/warning/info)' : ''}${type === 'improvements' ? '   - Spot patterns where the agent struggled\n   - Suggest hooks, skills, subagents, tools, context, architecture, legibility improvements\n   - Include ready-to-use config when possible' : ''}
4. Submit your result promptly — don't over-explore

## Submitting Results

When you have your analysis ready, submit it via the API:

\`\`\`bash
# Submit the complete result
curl -s -X POST '${apiBase}/analysis/ANALYSIS_ID/submit' \\
  -H 'Content-Type: application/json' \\
  -d '{"result": YOUR_JSON_RESULT}'

# Or submit incrementally (append: true merges with previous submissions)
curl -s -X POST '${apiBase}/analysis/ANALYSIS_ID/submit' \\
  -H 'Content-Type: application/json' \\
  -d '{"result": {"plans": [...]}, "append": true}'
\`\`\`

Your analysis ID is: \`${analysisId}\` — use it in the URL above.

## Output

After submitting via the API, output a brief summary of what you found. The actual structured result should be submitted via the API above, not printed to stdout.`;
}

function runClaudeAgent(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    const child = spawn('claude', [
      '-p', '-',
      '--output-format', 'json',
      '--allowedTools', 'Bash,WebFetch',
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 600_000, // 10 min — agent needs time to explore
      shell: false,
    });

    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => errChunks.push(chunk));

    child.on('close', (code) => {
      const output = Buffer.concat(chunks).toString('utf-8');
      if (code === 0 || output.length > 0) {
        resolve(output);
      } else {
        reject(new Error(Buffer.concat(errChunks).toString('utf-8') || `claude exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });

    // Write prompt to stdin and close
    child.stdin.write(prompt);
    child.stdin.end();
  });
}
