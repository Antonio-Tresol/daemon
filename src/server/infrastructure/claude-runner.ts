import { spawn } from 'node:child_process';
import type {
  AnalysisType,
  AnalysisResult,
} from '../domain/analysis/analysis.entity';
import type {
  ClaudeRunnerPort,
  SendMessageResult,
} from '../domain/claude/claude-runner.port';
import { loadPrompt } from './load-prompt';
import { parseAnalysisResult } from './parse-analysis-result';

const SEND_MESSAGE_TIMEOUT_MS = 60_000;
const ANALYSIS_TIMEOUT_MS = 120_000;

export class ClaudeRunner implements ClaudeRunnerPort {
  async sendMessage(
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
        timeout: SEND_MESSAGE_TIMEOUT_MS,
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

  async runAnalysis(
    type: AnalysisType,
    sessionData: string,
  ): Promise<AnalysisResult['result']> {
    return runAnalysisImpl(type, sessionData);
  }
}

async function runAnalysisImpl(
  type: AnalysisType,
  sessionData: string,
): Promise<AnalysisResult['result']> {
  const promptTemplate = loadPrompt(type);
  const fullPrompt = `${promptTemplate}\n\n<session_data>\n${sessionData}\n</session_data>`;

  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      fullPrompt,
      '--output-format',
      'json',
      '--allowedTools',
      'Read',
      '--bare',
    ];

    const proc = spawn('claude', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: ANALYSIS_TIMEOUT_MS,
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
      reject(new Error(`Failed to spawn claude process: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Claude process exited with code ${String(code)}: ${stderr}`,
          ),
        );
        return;
      }

      try {
        resolve(parseAnalysisResult(stdout));
      } catch {
        reject(
          new Error(
            `Failed to parse Claude output as JSON: ${stdout.slice(0, 500)}`,
          ),
        );
      }
    });
  });
}
