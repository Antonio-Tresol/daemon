---
description: "Remove daemon monitoring from this environment"
---

# Offboard from Daemon

Remove daemon instrumentation from your Claude Code environment.

## Option A: Plugin Users

If you installed via plugin, simply stop using the `--plugin-dir` flag:

```bash
# Before (instrumented)
claude --plugin-dir /path/to/daemon/plugin

# After (not instrumented)
claude
```

No cleanup needed — plugin hooks are only active when the plugin is loaded.

## Option B: Global Hook Removal

If you installed hooks globally via the onboard script:

### 1. Find daemon installation

```bash
echo "${DAEMON_PATH:-not set}"
ls -d ~/daemon ~/projects/daemon ~/code/daemon 2>/dev/null
```

### 2. Remove hooks

```bash
bash $DAEMON_PATH/scripts/uninstall-hooks.sh
```

This surgically removes only daemon HTTP hooks from `~/.claude/settings.json`, preserving all other hooks and settings. A backup is created automatically.

### 3. Verify removal

```bash
# Should return 0 matches
grep -c "api/events" ~/.claude/settings.json 2>/dev/null || echo "Clean — no daemon hooks found"
```

### 4. Report

Confirm what was removed:
- HTTP hooks targeting `/api/events` — removed
- Other hooks and settings — preserved
- Backup saved at `~/.claude/settings.json.pre-uninstall`

Note: OTel env vars only persist for the current shell. They will be gone after restart.
