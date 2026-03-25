import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: vi.fn(),
}));

import { query } from '@anthropic-ai/claude-agent-sdk';
import {
  buildAgentPrompt,
  readPromptTemplate,
  runClaudeAgent,
} from './run-agent-analysis';

describe('buildAgentPrompt', () => {
  it('includes session ID and event count for level 0', () => {
    const result = buildAgentPrompt(
      'template',
      'session-1',
      'timeline',
      0,
      42,
      'http://localhost:3000',
      'analysis-1',
    );

    expect(result).toContain('session-1');
    expect(result).toContain('42 events');
    expect(result).toContain('analysis-1');
  });

  it('includes meta-analysis info for level > 0', () => {
    const result = buildAgentPrompt(
      'meta template',
      'session-1',
      'timeline',
      1,
      0,
      'http://localhost:3000',
      'analysis-2',
    );

    expect(result).toContain('Level 1 meta-analysis');
    expect(result).toContain('Level 0');
    expect(result).toContain('analysis-2');
  });

  it('includes event summary when provided', () => {
    const result = buildAgentPrompt(
      'template',
      'session-1',
      'failures',
      0,
      10,
      'http://localhost:3000',
      'analysis-3',
      'summary of events',
    );

    expect(result).toContain('summary of events');
  });
});

describe('readPromptTemplate', () => {
  it('returns fallback string when prompt file does not exist', async () => {
    const result = await readPromptTemplate('timeline', 0);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns meta-analysis fallback for level > 0 when file is missing', async () => {
    const result = await readPromptTemplate('timeline', 1);

    expect(result).toContain('meta-analysis');
  });
});

describe('runClaudeAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls SDK query with prompt', async () => {
    const mockQuery = (async function* () {
      yield {
        type: 'result' as const,
        subtype: 'success' as const,
        result: 'sdk output',
      };
    })();
    vi.mocked(query).mockReturnValue(
      mockQuery as ReturnType<typeof query>, // vi.mocked returns unknown, narrow to SDK return type
    );

    const result = await runClaudeAgent('test prompt');

    expect(result).toBe('sdk output');
    expect(query).toHaveBeenCalled();
  });

  it('propagates SDK errors', async () => {
    vi.mocked(query).mockImplementation(() => {
      throw new Error('SDK failed');
    });

    await expect(runClaudeAgent('test prompt')).rejects.toThrow('SDK failed');
  });
});
