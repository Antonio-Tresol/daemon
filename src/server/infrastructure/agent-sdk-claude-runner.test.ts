import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: vi.fn(),
}));

vi.mock('./load-prompt', () => ({
  loadPrompt: vi.fn().mockReturnValue('test prompt template'),
}));

import { query } from '@anthropic-ai/claude-agent-sdk';
import { AgentSdkClaudeRunner } from './agent-sdk-claude-runner';

function createMockQuery(
  result: string,
): AsyncGenerator<{ type: string; subtype: string; result: string }> {
  return (async function* () {
    yield { type: 'assistant', subtype: '', result: '' };
    yield { type: 'result', subtype: 'success', result };
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
        createErrorQuery() as ReturnType<typeof query>,
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
    it('loads prompt template and parses result', async () => {
      const analysisJson = JSON.stringify({
        plans: [{ name: 'Test Plan', phase: 'testing', tasks: [] }],
      });
      vi.mocked(query).mockReturnValue(
        createMockQuery(analysisJson) as ReturnType<typeof query>,
      );

      const result = await runner.runAnalysis('timeline', 'session data');

      expect(result).toEqual({
        plans: [{ name: 'Test Plan', phase: 'testing', tasks: [] }],
      });
      expect(query).toHaveBeenCalledWith({
        prompt: expect.stringContaining('test prompt template'),
        options: expect.objectContaining({
          allowedTools: ['Read'],
        }),
      });
    });

    it('passes session data in the prompt', async () => {
      vi.mocked(query).mockReturnValue(
        createMockQuery('{}') as ReturnType<typeof query>,
      );

      await runner.runAnalysis('failures', 'my session data');

      const calledPrompt = vi.mocked(query).mock.calls[0]?.[0]?.prompt;
      expect(calledPrompt).toContain('<session_data>');
      expect(calledPrompt).toContain('my session data');
    });
  });
});
