import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveClaudeAuth } from './claude-auth';

describe('resolveClaudeAuth', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns api_key auth when ANTHROPIC_API_KEY is set', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-key');
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');

    const result = resolveClaudeAuth();

    expect(result).toEqual({ type: 'api_key', key: 'sk-test-key' });
  });

  it('returns oauth_token auth when CLAUDE_CODE_OAUTH_TOKEN is set and no API key', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'oauth-test-token');

    const result = resolveClaudeAuth();

    expect(result).toEqual({ type: 'oauth_token', token: 'oauth-test-token' });
  });

  it('returns null when neither env var is set', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');

    const result = resolveClaudeAuth();

    expect(result).toBeNull();
  });

  it('prefers api_key over oauth_token when both are set', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-key');
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'oauth-test-token');

    const result = resolveClaudeAuth();

    expect(result).toEqual({ type: 'api_key', key: 'sk-test-key' });
  });
});
