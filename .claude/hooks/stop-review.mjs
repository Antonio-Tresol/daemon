#!/usr/bin/env node
/**
 * Stop hook: Quick mechanical checks before Claude finishes.
 * Runs tsc and vitest. If they fail, blocks the stop with clear feedback.
 * If they pass, exits 0 (allows stop).
 */
import { execSync } from 'node:child_process';

const env = {
  ...process.env,
  PATH: `/c/Program Files/nodejs:${process.env.HOME || process.env.USERPROFILE}/AppData/Roaming/npm:${process.env.PATH}`,
};

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

  const issues = [];

  // Check 1: TypeScript compiles
  try {
    execSync('npx tsc --noEmit', { env, stdio: 'pipe', timeout: 60000 });
  } catch (e) {
    const stderr = e.stderr?.toString() || e.stdout?.toString() || '';
    const errorLines = stderr.split('\n').filter(l => l.includes('error TS')).slice(0, 5);
    issues.push(`tsc found type errors:\n${errorLines.join('\n') || '(run npx tsc --noEmit for details)'}`);
  }

  // Check 2: Tests pass
  try {
    execSync('npx vitest run', { env, stdio: 'pipe', timeout: 120000 });
  } catch (e) {
    const output = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
    const summary = output.split('\n').filter(l => /Tests|test files|failed/i.test(l)).slice(0, 3);
    issues.push(`Tests failing:\n${summary.join('\n') || '(run npx vitest run for details)'}`);
  }

  if (issues.length > 0) {
    process.stderr.write([
      '',
      'Pre-stop checks failed — please fix before finishing:',
      '',
      ...issues,
      '',
    ].join('\n'));
    process.exit(2);
  }

  process.exit(0);
});
