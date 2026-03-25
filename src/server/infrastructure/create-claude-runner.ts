import { resolveClaudeAuth } from './claude-auth';
import { AgentSdkClaudeRunner } from './agent-sdk-claude-runner';
import { ClaudeRunner } from './claude-runner';
import type { ClaudeRunnerPort } from '../domain/claude/claude-runner.port';

export function createClaudeRunner(): ClaudeRunnerPort {
  const auth = resolveClaudeAuth();
  if (auth) return new AgentSdkClaudeRunner();
  return new ClaudeRunner();
}
