import { AgentSdkClaudeRunner } from './agent-sdk-claude-runner';
import type { ClaudeRunnerPort } from '../domain/claude/claude-runner.port';

export function createClaudeRunner(): ClaudeRunnerPort {
  return new AgentSdkClaudeRunner();
}
