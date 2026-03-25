import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: vi.fn(),
}));

vi.mock('./load-prompt', () => ({
  loadPrompt: vi.fn().mockReturnValue('test prompt template'),
}));

vi.mock('./analysis-schemas', () => ({
  getOutputFormat: vi.fn().mockReturnValue({
    type: 'json_schema',
    schema: { type: 'object', properties: { plans: { type: 'array' } }, required: ['plans'] },
  }),
}));

import { query } from '@anthropic-ai/claude-agent-sdk';
import { AgentSdkClaudeRunner } from './agent-sdk-claude-runner';

function createMockQuery(
  result: string,
  structuredOutput?: unknown,
): AsyncGenerator<{ type: string; subtype: string; result: string; structured_output?: unknown }> {
  return (async function* () {
    yield { type: 'assistant', subtype: '', result: '' };
    yield {
      type: 'result',
      subtype: 'success',
      result,
      ...(structuredOutput !== undefined ? { structured_output: structuredOutput } : {}),
    };
  })();
}

function createErrorQuery(): AsyncGenerator<{
  type: string;
  subtype: string;
  result: string;
}> {
  return (async function* () {
    throw new Error('SDK connection failed');
    // unreachable yield to satisfy generator type
    yield { type: 'result', subtype: 'success', result: '' };
  })();
}

describe('AgentSdkClaudeRunner', () => {
  let runner: AgentSdkClaudeRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new AgentSdkClaudeRunner();
  });

  describe('sendMessage', () => {
    it('returns successful result from SDK query', async () => {
      vi.mocked(query).mockReturnValue(
        // query() returns a Query (AsyncGenerator with extra methods); cast for test
        createMockQuery('Hello from Claude') as ReturnType<typeof query>,
      );

      const result = await runner.sendMessage('session-123', 'Hello');

      expect(result).toEqual({
        success: true,
        response: 'Hello from Claude',
        error: null,
      });
      expect(query).toHaveBeenCalledWith({
        prompt: 'Hello',
        options: expect.objectContaining({
          resume: 'session-123',
        }),
      });
    });

    it('returns error result on SDK failure', async () => {
      vi.mocked(query).mockReturnValue(
        createErrorQuery() as ReturnType<typeof query>, // mock generator narrowed to SDK return type
      );

      const result = await runner.sendMessage('session-123', 'Hello');

      expect(result).toEqual({
        success: false,
        response: '',
        error: 'SDK connection failed',
      });
    });
  });

  describe('runAnalysis', () => {
    it('uses structured output when available', async () => {
      const structuredData = {
        plans: [{ name: 'Test Plan', phase: 'testing', tasks: [] }],
      };
      vi.mocked(query).mockReturnValue(
        createMockQuery('text fallback', structuredData) as ReturnType<typeof query>,
      );

      const result = await runner.runAnalysis('timeline', 'session data');

      expect(result).toEqual(structuredData);
      expect(query).toHaveBeenCalledWith({
        prompt: expect.stringContaining('test prompt template'),
        options: expect.objectContaining({
          allowedTools: ['Read'],
          outputFormat: expect.objectContaining({
            type: 'json_schema',
          }),
        }),
      });
    });

    it('falls back to text parsing when structured output is absent', async () => {
      const analysisJson = JSON.stringify({
        plans: [{ name: 'Fallback Plan', phase: 'testing', tasks: [] }],
      });
      vi.mocked(query).mockReturnValue(createMockQuery(analysisJson) as ReturnType<typeof query>);

      const result = await runner.runAnalysis('timeline', 'session data');

      expect(result).toEqual({
        plans: [{ name: 'Fallback Plan', phase: 'testing', tasks: [] }],
      });
    });

    it('passes session data in the prompt', async () => {
      vi.mocked(query).mockReturnValue(
        createMockQuery('{}', { failures: [] }) as ReturnType<typeof query>,
      );

      await runner.runAnalysis('failures', 'my session data');

      const calledPrompt = vi.mocked(query).mock.calls[0]?.[0]?.prompt;
      expect(calledPrompt).toContain('<session_data>');
      expect(calledPrompt).toContain('my session data');
    });

    it('passes outputFormat option to SDK query', async () => {
      vi.mocked(query).mockReturnValue(
        createMockQuery('{}', { improvements: [] }) as ReturnType<typeof query>,
      );

      await runner.runAnalysis('improvements', 'data');

      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            outputFormat: expect.objectContaining({
              type: 'json_schema',
            }),
          }),
        }),
      );
    });
  });
});
