#!/bin/bash
# Verify Command Center setup (read-only, changes nothing).
# Usage: bash scripts/verify-setup.sh
#
# Checks: hooks installed, OTel configured, server reachable.
# Exits 0 if all pass, 1 otherwise.

PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" = "ok" ]; then
    printf "  %-24s %s\n" "$label" "[OK]"
    PASS=$((PASS + 1))
  else
    printf "  %-24s %s\n" "$label" "[FAIL]"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Command Center — Setup Verification ==="
echo ""

# Check 1: Hooks installed
SETTINGS_FILE="${HOME}/.claude/settings.json"
if [ -f "$SETTINGS_FILE" ] && grep -q "api/events" "$SETTINGS_FILE" 2>/dev/null; then
  check "Hooks installed" "ok"
else
  check "Hooks installed" "fail"
fi

# Check 2: OTel configured
if [ "${CLAUDE_CODE_ENABLE_TELEMETRY:-}" = "1" ]; then
  check "OTel configured" "ok"
else
  check "OTel configured" "fail"
fi

# Check 3: Server reachable
if curl -sf http://localhost:3000/api/agent > /dev/null 2>&1; then
  check "Server reachable" "ok"
else
  check "Server reachable" "fail"
fi

echo ""
echo "  $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  Remediation:"
  if ! grep -q "api/events" "$SETTINGS_FILE" 2>/dev/null; then
    echo "    Hooks:  bash scripts/setup-hooks.sh"
  fi
  if [ "${CLAUDE_CODE_ENABLE_TELEMETRY:-}" != "1" ]; then
    echo "    OTel:   source scripts/setup-otel.sh"
  fi
  if ! curl -sf http://localhost:3000/api/agent > /dev/null 2>&1; then
    echo "    Server: cd $(dirname "$(dirname "$(realpath "$0")")") && npm run dev"
  fi
  exit 1
fi

exit 0
