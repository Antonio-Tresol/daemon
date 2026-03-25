#!/usr/bin/env node
/**
 * Stop hook: Quick mechanical checks before Claude finishes.
 * Runs tsc and vitest. If they fail, blocks the stop with exit 2.
 * If they pass, exits 0 (allows stop).
 */
import { execSync } from 'node:child_process';

const env = {
  ...process.env,
  PATH: `/c/Program Files/nodejs:${process.env.HOME || process.env.USERPROFILE}/AppData/Roaming/npm:${process.env.PATH}`,
};

// Read stdin (stop hook input) but we don't need it for these checks
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  // Skip checks if stop_hook_active (prevent infinite loop)
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) {
      process.exit(0);
    }
  } catch { /* proceed with checks */ }

  const errors = [];

  // Check 1: TypeScript compiles
  try {
    execSync('npx tsc --noEmit', { env, stdio: 'pipe', timeout: 60000 });
  } catch (e) {
    errors.push('TypeScript errors: ' + (e.stderr?.toString() || e.stdout?.toString() || 'tsc failed').slice(0, 200));
  }

  // Check 2: Tests pass
  try {
    execSync('npx vitest run', { env, stdio: 'pipe', timeout: 120000 });
  } catch (e) {
    const output = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
    const failLine = output.split('\n').find(l => /fail/i.test(l)) || 'tests failed';
    errors.push(failLine.trim().slice(0, 200));
  }

  if (errors.length > 0) {
    process.stderr.write('Stop blocked — fix before finishing:\n' + errors.join('\n'));
    process.exit(2);
  }

  process.exit(0);
});
