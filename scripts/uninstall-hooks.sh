#!/bin/bash
# Remove Claude Command Center hooks from Claude Code settings.
# Usage: bash scripts/uninstall-hooks.sh
#
# Surgically removes only the Command Center HTTP hooks,
# leaving all other hooks and settings untouched.

set -euo pipefail

SETTINGS_FILE="$HOME/.claude/settings.json"

if [ ! -f "$SETTINGS_FILE" ]; then
  echo "No settings file found at $SETTINGS_FILE — nothing to uninstall."
  exit 0
fi

echo "=== Claude Command Center - Hook Removal ==="
echo "Settings: $SETTINGS_FILE"

# Backup first
cp "$SETTINGS_FILE" "$SETTINGS_FILE.pre-uninstall"
echo "Backed up to $SETTINGS_FILE.pre-uninstall"

export PATH="/c/Program Files/nodejs:$PATH"

node -e "
const fs = require('fs');
const settingsFile = process.argv[1];

const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
const hooks = settings.hooks;

if (!hooks) {
  console.log('No hooks found — nothing to remove.');
  process.exit(0);
}

let removed = 0;

for (const event of Object.keys(hooks)) {
  const entries = hooks[event];
  if (!Array.isArray(entries)) continue;

  // Filter out any hook entry that has an HTTP hook pointing to /api/events
  hooks[event] = entries.filter(entry => {
    const isCommandCenter = entry.hooks?.some(
      h => h.type === 'http' && h.url && h.url.includes('/api/events')
    );
    // Also check command-type hooks that curl to /api/events
    const isCurlCC = entry.hooks?.some(
      h => h.type === 'command' && h.command && h.command.includes('/api/events')
    );
    if (isCommandCenter || isCurlCC) {
      removed++;
      return false;
    }
    return true;
  });

  // Clean up empty event arrays
  if (hooks[event].length === 0) {
    delete hooks[event];
  }
}

// Clean up empty hooks object
if (Object.keys(hooks).length === 0) {
  delete settings.hooks;
}

fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
console.log('Removed ' + removed + ' Command Center hook(s).');

// Show what's left
const remaining = settings.hooks ? Object.keys(settings.hooks).length : 0;
console.log(remaining + ' hook event(s) remaining from other sources.');
" "$SETTINGS_FILE"

echo ""
echo "Done! Command Center hooks removed."
echo "Your other hooks and settings are untouched."
echo "Backup saved to $SETTINGS_FILE.pre-uninstall"
