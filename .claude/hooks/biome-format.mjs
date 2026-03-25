#!/usr/bin/env node
/**
 * PostToolUse hook: Run Biome format on edited/written .ts/.tsx files.
 */
import { execSync } from 'node:child_process';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const file = data.tool_input?.file_path || data.tool_input?.filePath || '';

    if (file && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      execSync(`npx @biomejs/biome check --write "${file}"`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000,
        env: {
          ...process.env,
          PATH: `/c/Program Files/nodejs:${process.env.HOME || process.env.USERPROFILE}/AppData/Roaming/npm:${process.env.PATH}`,
        },
      });
    }
  } catch { /* biome errors are non-blocking */ }
  process.exit(0);
});
