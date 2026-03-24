import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AnalysisType,
  AnalysisResult,
} from '../domain/analysis/analysis.entity';

const PROMPT_DIR = path.resolve(process.cwd(), 'src', 'prompts');
const TIMEOUT_MS = 120_000;

function getPromptPath(type: AnalysisType): string {
  const fileMap: Record<AnalysisType, string> = {
    timeline: 'analyze-session.md',
    failures: 'detect-failures.md',
    improvements: 'suggest-improvements.md',
  };
  return path.join(PROMPT_DIR, fileMap[type]);
}

function loadPrompt(type: AnalysisType): string {
  const promptPath = getPromptPath(type);
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }
  return fs.readFileSync(promptPath, 'utf-8');
}

export async function runAnalysis(
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
        const parsed = JSON.parse(stdout) as Record<string, unknown>;

        const result: AnalysisResult['result'] = {};

        if (
          'plans' in parsed &&
          Array.isArray(parsed.plans)
        ) {
          result.plans = parsed.plans as AnalysisResult['result'] extends null
            ? never
            : NonNullable<AnalysisResult['result']>['plans'];
        }

        if (
          'failures' in parsed &&
          Array.isArray(parsed.failures)
        ) {
          result.failures =
            parsed.failures as NonNullable<AnalysisResult['result']>['failures'];
        }

        if (
          'improvements' in parsed &&
          Array.isArray(parsed.improvements)
        ) {
          result.improvements =
            parsed.improvements as NonNullable<AnalysisResult['result']>['improvements'];
        }

        resolve(result);
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
