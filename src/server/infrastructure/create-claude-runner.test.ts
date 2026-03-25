import { describe, expect, it, vi } from 'vitest';

vi.mock('./agent-sdk-claude-runner', () => ({
  AgentSdkClaudeRunner: vi.fn(),
}));

import { AgentSdkClaudeRunner } from './agent-sdk-claude-runner';
import { createClaudeRunner } from './create-claude-runner';

describe('createClaudeRunner', () => {
  it('returns AgentSdkClaudeRunner', () => {
    const runner = createClaudeRunner();
    expect(runner).toBeInstanceOf(AgentSdkClaudeRunner);
  });
});
