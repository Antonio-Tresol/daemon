import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type AnalysisType, PROMPT_FILES } from '@/entities/analysis/analysis-types';

const META_PROMPT_FILE = 'meta-analysis.md';

export async function readPromptTemplate(type: AnalysisType, level: number): Promise<string> {
  const promptFile = level > 0 ? META_PROMPT_FILE : PROMPT_FILES[type];
  const promptPath = join(process.cwd(), 'src', 'prompts', promptFile);
  try {
    return await readFile(promptPath, 'utf-8');
  } catch {
    return level > 0
      ? `Perform a meta-analysis (Level ${level}) on the Level ${level - 1} ${type} analysis.`
      : `Analyze the Claude Code session events and produce a ${type} analysis as JSON.`;
  }
}

export function buildAgentPrompt(
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

Query the daemon API to get the data you need:

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

You have access to the daemon API at \`${apiBase}\` if you need more detail. Use curl + jq.

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

export function runClaudeAgent(prompt: string): Promise<string> {
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
