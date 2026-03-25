export type ClaudeAuth = { type: 'api_key'; key: string } | { type: 'oauth_token'; token: string };

export function resolveClaudeAuth(): ClaudeAuth | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return { type: 'api_key', key: apiKey };
  const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (oauthToken) return { type: 'oauth_token', token: oauthToken };
  return null;
}
