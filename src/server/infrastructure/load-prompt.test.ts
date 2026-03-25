import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

import fs from 'node:fs';
import { getPromptPath, loadPrompt } from './load-prompt';

const PROMPT_DIR = path.resolve(process.cwd(), 'src', 'prompts');

describe('getPromptPath', () => {
  it('returns correct path for timeline', () => {
    expect(getPromptPath('timeline')).toBe(path.join(PROMPT_DIR, 'analyze-session.md'));
  });

  it('returns correct path for failures', () => {
    expect(getPromptPath('failures')).toBe(path.join(PROMPT_DIR, 'detect-failures.md'));
  });

  it('returns correct path for improvements', () => {
    expect(getPromptPath('improvements')).toBe(path.join(PROMPT_DIR, 'suggest-improvements.md'));
  });
});

describe('loadPrompt', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReset();
    vi.mocked(fs.readFileSync).mockReset();
  });

  it('returns file contents when prompt file exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('prompt content');

    const result = loadPrompt('timeline');

    expect(result).toBe('prompt content');
    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(PROMPT_DIR, 'analyze-session.md'),
      'utf-8',
    );
  });

  it('throws when prompt file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(() => loadPrompt('timeline')).toThrow('Prompt file not found');
  });
});
