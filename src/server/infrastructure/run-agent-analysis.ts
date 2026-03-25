import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AnalysisType } from '@/server/domain/analysis/analysis.entity';
import { getOutputFormat } from './analysis-schemas';

/** Maps analysis types to their prompt template files. Infrastructure concern. */
const PROMPT_FILES: Record<AnalysisType, string> = {
  timeline: 'analyze-session.md',
  failures: 'detect-failures.md',
  improvements: 'suggest-improvements.md',
};

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

Your analysis ID is: \`${analysisId}\`

Your output will be automatically captured as structured JSON — just produce the analysis as your final response. If needed, you can also submit via the API:

\`\`\`bash
curl -s -X POST '${apiBase}/analysis/${analysisId}/submit' \\
  -H 'Content-Type: application/json' \\
  -d '{"result": YOUR_JSON_RESULT}'
\`\`\``;
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

## Output

Your response will be automatically captured as structured JSON matching the analysis schema. Produce your analysis as the final output.

Your analysis ID is: \`${analysisId}\``;
}

/** Result from runClaudeAgentSdk — either structured output or raw text fallback */
export type AgentResult = {
  structured: unknown;
  raw: string;
};

export async function runClaudeAgentSdk(prompt: string, type: AnalysisType): Promise<AgentResult> {
  const abortController = new AbortController();
  const timeout = setTimeout(
    () => abortController.abort(),
    600_000, // 10 min — agent needs time to explore
  );

  try {
    const q = query({
      prompt,
      options: {
        allowedTools: ['Bash', 'WebFetch'],
        outputFormat: getOutputFormat(type),
        abortController,
      },
    });

    for await (const message of q) {
      if (message.type === 'result' && 'subtype' in message && message.subtype === 'success') {
        // SDK message type doesn't expose structured_output in its type; widen to check at runtime
        const msgObj = message as Record<string, unknown>;
        const structured = 'structured_output' in msgObj ? msgObj.structured_output : undefined;
        const raw = typeof msgObj.result === 'string' ? msgObj.result : '';
        return { structured: structured ?? null, raw };
      }
    }
    return { structured: null, raw: '' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runClaudeAgent(prompt: string, type: AnalysisType): Promise<AgentResult> {
  return runClaudeAgentSdk(prompt, type);
}
