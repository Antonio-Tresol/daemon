#!/usr/bin/env node
/**
 * PreToolUse hook: Enforce FSD layer boundaries.
 * - shared/ cannot import from entities/ or features/
 * - entities/ cannot import from features/ or app/
 */
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const file = data.tool_input?.file_path || data.tool_input?.filePath || '';
    const content = data.tool_input?.new_string || data.tool_input?.content || '';
    const normalizedFile = file.replace(/\\/g, '/');

    if (normalizedFile.includes('/shared/')) {
      if (/from\s+['"].*(?:features|entities)\//.test(content)) {
        process.stderr.write('BLOCKED: Shared layer cannot import from features/entities (FSD violation)');
        process.exit(2);
      }
    }

    if (normalizedFile.includes('/entities/')) {
      if (/from\s+['"].*(?:features|app)\//.test(content)) {
        process.stderr.write('BLOCKED: Entities layer cannot import from features/app (FSD violation)');
        process.exit(2);
      }
    }
  } catch { /* ignore parse errors */ }
  process.exit(0);
});
