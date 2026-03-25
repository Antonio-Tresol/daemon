#!/bin/bash
# Full onboard: install hooks + configure OTel + verify server.
# Usage: bash scripts/onboard.sh
#
# Combines setup-hooks.sh and setup-otel.sh into a single command,
# then verifies everything is working.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CC_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== daemon — Onboard ==="
echo ""

# Step 1: Install hooks
echo "--- Installing hooks ---"
bash "$SCRIPT_DIR/setup-hooks.sh"

# Step 2: Configure OTel
echo ""
echo "--- Configuring OTel ---"
# Source OTel vars into current shell
# shellcheck disable=SC1091
source "$SCRIPT_DIR/setup-otel.sh"

# Step 3: Verify server
echo ""
echo "--- Verifying server ---"
if curl -sf http://localhost:3000/api/agent > /dev/null 2>&1; then
  echo "  [OK] daemon running at localhost:3000"
else
  echo "  [!!] daemon NOT running"
  echo "  Start it:  cd $CC_DIR && npm run dev"
fi

# Step 4: Verify hooks
echo ""
echo "--- Verifying hooks ---"
SETTINGS_FILE="${HOME}/.claude/settings.json"
if [ -f "$SETTINGS_FILE" ] && grep -q "api/events" "$SETTINGS_FILE" 2>/dev/null; then
  echo "  [OK] Hooks installed in $SETTINGS_FILE"
else
  echo "  [!!] Hooks NOT found in $SETTINGS_FILE"
fi

echo ""
echo "=== Onboard complete ==="
echo "Restart Claude Code to activate hooks."
echo "To undo: bash $SCRIPT_DIR/uninstall-hooks.sh"
