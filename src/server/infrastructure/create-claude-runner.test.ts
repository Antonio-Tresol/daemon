import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./claude-auth', () => ({
  resolveClaudeAuth: vi.fn(),
}));

vi.mock('./agent-sdk-claude-runner', () => ({
  AgentSdkClaudeRunner: vi.fn(),
}));

vi.mock('./claude-runner', () => ({
  ClaudeRunner: vi.fn(),
}));

import { resolveClaudeAuth } from './claude-auth';
import { AgentSdkClaudeRunner } from './agent-sdk-claude-runner';
import { ClaudeRunner } from './claude-runner';
import { createClaudeRunner } from './create-claude-runner';

describe('createClaudeRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns AgentSdkClaudeRunner when auth is available', () => {
    vi.mocked(resolveClaudeAuth).mockReturnValue({
      type: 'api_key',
      key: 'test-key',
    });

    const runner = createClaudeRunner();

    expect(runner).toBeInstanceOf(AgentSdkClaudeRunner);
  });

  it('returns ClaudeRunner when no auth is available', () => {
    vi.mocked(resolveClaudeAuth).mockReturnValue(null);

    const runner = createClaudeRunner();

    expect(runner).toBeInstanceOf(ClaudeRunner);
  });

  it('returns AgentSdkClaudeRunner for oauth_token auth', () => {
    vi.mocked(resolveClaudeAuth).mockReturnValue({
      type: 'oauth_token',
      token: 'oauth-token',
    });

    const runner = createClaudeRunner();

    expect(runner).toBeInstanceOf(AgentSdkClaudeRunner);
  });
});
