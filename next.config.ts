import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', '@anthropic-ai/claude-agent-sdk'],
};

export default nextConfig;
