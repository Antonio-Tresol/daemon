import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AnalysisResult, AnalysisType } from '../domain/analysis/analysis.entity';
import type { ClaudeRunnerPort, SendMessageResult } from '../domain/claude/claude-runner.port';
import { getOutputFormat } from './analysis-schemas';
import { loadPrompt } from './load-prompt';

const SEND_MESSAGE_TIMEOUT_MS = 60_000;
const ANALYSIS_TIMEOUT_MS = 120_000;

/**
 * Collects the final result from a Query async generator.
 * Returns both the text result and any structured_output.
 */
async function collectResult(
  queryIter: AsyncGenerator<{
    type: string;
    subtype?: string;
    result?: string;
    structured_output?: unknown;
  }>,
): Promise<{ text: string; structured: unknown }> {
  for await (const message of queryIter) {
    if (message.type === 'result' && message.subtype === 'success') {
      return {
        text: message.result ?? '',
        structured: message.structured_output ?? null,
      };
    }
  }
  return { text: '', structured: null };
}

export class AgentSdkClaudeRunner implements ClaudeRunnerPort {
  async sendMessage(sessionId: string, message: string): Promise<SendMessageResult> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), SEND_MESSAGE_TIMEOUT_MS);

    try {
      const q = query({
        prompt: message,
        options: {
          resume: sessionId,
          abortController,
        },
      });

      const { text } = await collectResult(q);

      return {
        success: true,
        response: text,
        error: null,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown SDK error';
      return {
        success: false,
        response: '',
        error: errorMessage,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async runAnalysis(type: AnalysisType, sessionData: string): Promise<AnalysisResult['result']> {
    const promptTemplate = loadPrompt(type);
    const fullPrompt = `${promptTemplate}\n\n<session_data>\n${sessionData}\n</session_data>`;

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      const q = query({
        prompt: fullPrompt,
        options: {
          allowedTools: ['Read'],
          outputFormat: getOutputFormat(type),
          abortController,
        },
      });

      const { structured, text } = await collectResult(q);

      // Prefer structured output from SDK; fall back to parsing text
      if (structured && typeof structured === 'object') {
        return structured as NonNullable<AnalysisResult['result']>; // structured is unknown from SDK; narrowed by typeof check above
      }

      // Fallback: parse the text result (legacy path)
      const { parseAnalysisResult } = await import('./parse-analysis-result');
      return parseAnalysisResult(text);
    } finally {
      clearTimeout(timeout);
    }
  }
}
