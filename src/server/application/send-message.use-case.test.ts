import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SendMessageUseCase } from './send-message.use-case';
import type { ClaudeRunnerPort, SendMessageResult } from '../domain/claude/claude-runner.port';

function createMockClaudeRunner(): ClaudeRunnerPort {
  return {
    sendMessage: vi.fn(),
    runAnalysis: vi.fn(),
  };
}

describe('SendMessageUseCase', () => {
  let claudeRunner: ReturnType<typeof createMockClaudeRunner>;
  let useCase: SendMessageUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    claudeRunner = createMockClaudeRunner();
    useCase = new SendMessageUseCase(claudeRunner);
  });

  it('delegates to claudeRunner.sendMessage and returns the result', async () => {
    const mockResult: SendMessageResult = {
      success: true,
      response: 'Hello from Claude',
      error: null,
    };
    vi.mocked(claudeRunner.sendMessage).mockResolvedValue(mockResult);

    const result = await useCase.execute('sess-1', 'Hello');

    expect(claudeRunner.sendMessage).toHaveBeenCalledWith('sess-1', 'Hello');
    expect(result).toEqual(mockResult);
  });

  it('returns error result from runner', async () => {
    const mockResult: SendMessageResult = {
      success: false,
      response: '',
      error: 'Connection failed',
    };
    vi.mocked(claudeRunner.sendMessage).mockResolvedValue(mockResult);

    const result = await useCase.execute('sess-2', 'Test');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection failed');
  });

  it('propagates rejection from runner', async () => {
    vi.mocked(claudeRunner.sendMessage).mockRejectedValue(new Error('Network error'));

    await expect(useCase.execute('sess-3', 'Boom')).rejects.toThrow('Network error');
  });
});
