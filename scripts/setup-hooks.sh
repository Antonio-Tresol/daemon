#!/bin/bash
# Install Claude Code hooks to send events to daemon.
# Usage: bash scripts/setup-hooks.sh
#
# Adds native HTTP hooks to your global Claude Code settings (~/.claude/settings.json).
# All Claude Code sessions will POST events to localhost:3000/api/events.

set -euo pipefail

SETTINGS_FILE="$HOME/.claude/settings.json"
SERVER_URL="${DAEMON_URL:-http://localhost:3000}"
EVENTS_URL="$SERVER_URL/api/events"

echo "=== daemon — Hook Setup ==="
echo "Settings: $SETTINGS_FILE"
echo "Endpoint: $EVENTS_URL"
echo ""

# Backup
if [ -f "$SETTINGS_FILE" ]; then
  cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup"
  echo "Backed up settings to $SETTINGS_FILE.backup"
fi

# Use node to safely merge hooks into existing settings
export PATH="/c/Program Files/nodejs:$PATH"

node -e "
const fs = require('fs');
const path = require('path');

const settingsFile = process.argv[1];
const eventsUrl = process.argv[2];

// Read existing settings
let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
} catch {
  // File doesn't exist or is invalid
}

// Define daemon hooks using native HTTP type
const ccHook = { type: 'http', url: eventsUrl };
const ccEntry = (matcher) => ({ matcher: matcher || '', hooks: [ccHook] });

const ccEvents = [
  'SessionStart', 'SessionEnd',
  'PostToolUse', 'PostToolUseFailure',
  'Stop',
  'SubagentStart', 'SubagentStop'
];

// Merge: preserve existing hooks, add ours if not already present
const hooks = settings.hooks || {};

for (const event of ccEvents) {
  const existing = hooks[event] || [];
  const alreadyInstalled = existing.some(h =>
    h.hooks && h.hooks.some(inner => inner.type === 'http' && inner.url && inner.url.includes('/api/events'))
  );
  if (!alreadyInstalled) {
    hooks[event] = [...existing, ccEntry('')];
  }
}

settings.hooks = hooks;
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
console.log('daemon hooks installed for: ' + ccEvents.join(', '));
" "$SETTINGS_FILE" "$EVENTS_URL"

echo ""
echo "Done! Restart Claude Code to activate hooks."
echo "Make sure daemon is running: npm run dev"
