#!/usr/bin/env node
/**
 * PreToolUse hook: Block infrastructure imports in domain layer.
 * Reads JSON from stdin, checks if an Edit/Write to server/domain/ contains infra imports.
 */
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const file = data.tool_input?.file_path || data.tool_input?.filePath || '';
    const content = data.tool_input?.new_string || data.tool_input?.content || '';

    if (file.includes('server/domain/') || file.includes('server\\domain\\')) {
      const forbidden = /from\s+['"].*(?:infrastructure|sqlite|better-sqlite|node:fs|node:child_process)/;
      if (forbidden.test(content)) {
        process.stderr.write('BLOCKED: Domain layer must not import infrastructure');
        process.exit(2);
      }
    }
  } catch { /* ignore parse errors */ }
  process.exit(0);
});
