import { query } from '@anthropic-ai/claude-agent-sdk';
import type {
  AnalysisType,
  AnalysisResult,
} from '../domain/analysis/analysis.entity';
import type {
  ClaudeRunnerPort,
  SendMessageResult,
} from '../domain/claude/claude-runner.port';
import { loadPrompt } from './load-prompt';
import { parseAnalysisResult } from './parse-analysis-result';

const SEND_MESSAGE_TIMEOUT_MS = 60_000;
const ANALYSIS_TIMEOUT_MS = 120_000;

/**
 * Collects the final text result from a Query async generator.
 * Returns the `result` string from the first SDKResultSuccess message.
 */
async function collectResult(
  queryIter: AsyncGenerator<{ type: string; subtype?: string; result?: string }>,
): Promise<string> {
  for await (const message of queryIter) {
    if (message.type === 'result' && message.subtype === 'success') {
      return message.result ?? '';
    }
  }
  return '';
}

export class AgentSdkClaudeRunner implements ClaudeRunnerPort {
  async sendMessage(
    sessionId: string,
    message: string,
  ): Promise<SendMessageResult> {
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      SEND_MESSAGE_TIMEOUT_MS,
    );

    try {
      const q = query({
        prompt: message,
        options: {
          resume: sessionId,
          abortController,
        },
      });

      const result = await collectResult(q);

      return {
        success: true,
        response: result,
        error: null,
      };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown SDK error';
      return {
        success: false,
        response: '',
        error: errorMessage,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async runAnalysis(
    type: AnalysisType,
    sessionData: string,
  ): Promise<AnalysisResult['result']> {
    const promptTemplate = loadPrompt(type);
    const fullPrompt = `${promptTemplate}\n\n<session_data>\n${sessionData}\n</session_data>`;

    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      ANALYSIS_TIMEOUT_MS,
    );

    try {
      const q = query({
        prompt: fullPrompt,
        options: {
          allowedTools: ['Read'],
          abortController,
        },
      });

      const result = await collectResult(q);
      return parseAnalysisResult(result);
    } finally {
      clearTimeout(timeout);
    }
  }
}
