import type { ClaudeRunnerPort, SendMessageResult } from '../domain/claude/claude-runner.port';

export class SendMessageUseCase {
  constructor(private readonly claudeRunner: ClaudeRunnerPort) {}

  async execute(sessionId: string, message: string): Promise<SendMessageResult> {
    return this.claudeRunner.sendMessage(sessionId, message);
  }
}
