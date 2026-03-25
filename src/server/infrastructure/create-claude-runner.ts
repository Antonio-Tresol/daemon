import type { ClaudeRunnerPort } from '../domain/claude/claude-runner.port';
import { AgentSdkClaudeRunner } from './agent-sdk-claude-runner';

export function createClaudeRunner(): ClaudeRunnerPort {
  return new AgentSdkClaudeRunner();
}
