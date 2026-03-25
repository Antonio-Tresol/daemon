import fs from 'node:fs';
import path from 'node:path';
import type { AnalysisType } from '../domain/analysis/analysis.entity';

const PROMPT_DIR = path.resolve(process.cwd(), 'src', 'prompts');

const FILE_MAP: Record<AnalysisType, string> = {
  timeline: 'analyze-session.md',
  failures: 'detect-failures.md',
  improvements: 'suggest-improvements.md',
};

export function getPromptPath(type: AnalysisType): string {
  return path.join(PROMPT_DIR, FILE_MAP[type]);
}

export function loadPrompt(type: AnalysisType): string {
  const promptPath = getPromptPath(type);
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }
  return fs.readFileSync(promptPath, 'utf-8');
}
