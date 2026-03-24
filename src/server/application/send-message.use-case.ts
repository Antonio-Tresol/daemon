import { spawn } from 'node:child_process';

interface SendMessageResult {
  success: boolean;
  response: string;
  error: string | null;
}

const TIMEOUT_MS = 60_000;

export class SendMessageUseCase {
  async execute(
    sessionId: string,
    message: string,
  ): Promise<SendMessageResult> {
    return new Promise((resolve) => {
      const args = [
        '--resume',
        sessionId,
        '-p',
        message,
        '--output-format',
        'json',
      ];

      const proc = spawn('claude', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: TIMEOUT_MS,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('error', (err) => {
        resolve({
          success: false,
          response: '',
          error: `Failed to spawn claude process: ${err.message}`,
        });
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          resolve({
            success: false,
            response: stdout,
            error: `Claude exited with code ${String(code)}: ${stderr}`,
          });
          return;
        }

        resolve({
          success: true,
          response: stdout,
          error: null,
        });
      });
    });
  }
}
