---
description: "Remove Claude Command Center monitoring from this environment"
---

# Offboard from Command Center

Cleanly remove all Command Center hooks and telemetry configuration without affecting other Claude Code settings.

## Steps

### 1. Find Command Center installation

```bash
echo "${COMMAND_CENTER_PATH:-not set}"

for dir in \
  "$HOME/Claude-Command-Center" \
  "$HOME/projects/Claude-Command-Center" \
  "$HOME/code/Claude-Command-Center" \
  "$HOME/Antonio-Uni/Claude-Command-Center" \
  "E:/Antonio-Uni/Claude-Command-Center"; do
  if [ -f "$dir/scripts/uninstall-hooks.sh" ]; then
    echo "Found: $dir"
    break
  fi
done
```

### 2. Remove hooks

```bash
bash $CC_PATH/scripts/uninstall-hooks.sh
```

This surgically removes only Command Center HTTP hooks from `~/.claude/settings.json`, preserving all other hooks and settings. A backup is created automatically.

### 3. Verify removal

```bash
# Should return 0 matches
grep -c "api/events" ~/.claude/settings.json 2>/dev/null || echo "Clean — no CC hooks found"
```

### 4. Report

Confirm what was removed:
- HTTP hooks targeting `/api/events` — removed
- Other hooks and settings — preserved
- Backup saved at `~/.claude/settings.json.pre-uninstall`

Note: OTel env vars only persist for the current shell. They will be gone after restart. To explicitly unset them now:

```bash
unset CLAUDE_CODE_ENABLE_TELEMETRY OTEL_METRICS_EXPORTER OTEL_LOGS_EXPORTER \
  OTEL_EXPORTER_OTLP_PROTOCOL OTEL_EXPORTER_OTLP_ENDPOINT \
  OTEL_LOG_USER_PROMPTS OTEL_LOG_TOOL_DETAILS \
  OTEL_METRIC_EXPORT_INTERVAL OTEL_LOGS_EXPORT_INTERVAL
```
