---
description: "Set up daemon monitoring — install the plugin or run the onboard script to instrument Claude Code sessions"
---

# Onboard to Daemon

Set up Claude Code monitoring by installing the daemon plugin or running the setup scripts.

## Option A: Plugin (Recommended)

The plugin auto-installs hooks and skills — no manual configuration needed.

```bash
claude --plugin-dir /path/to/daemon/plugin
```

This gives you:
- 7 HTTP hooks streaming events to daemon
- `/daemon:harness` — query failures and improvements
- `/daemon:analyze` — trigger analysis, explore matryoshka levels
- `/daemon:session` — inspect session events and metadata

## Option B: Global Hook Installation

If you prefer to install hooks globally (all sessions, no --plugin-dir flag needed):

### 1. Find daemon installation

```bash
# Check env var first
echo "${DAEMON_PATH:-not set}"

# Or locate the daemon directory
ls -d ~/daemon ~/projects/daemon ~/code/daemon 2>/dev/null
```

If not found, ask the user for the path.

### 2. Run onboard script

```bash
bash $DAEMON_PATH/scripts/onboard.sh
```

This installs hooks into `~/.claude/settings.json` (merging with existing hooks) and configures OTel env vars.

### 3. Verify setup

```bash
bash $DAEMON_PATH/scripts/verify-setup.sh
```

All three checks should pass: hooks installed, OTel configured, server reachable.

### 4. Report results

Show the verification output. If anything failed:
- **Hooks not installed**: Re-run `bash $DAEMON_PATH/scripts/setup-hooks.sh`
- **OTel not configured**: Run `source $DAEMON_PATH/scripts/setup-otel.sh`
- **Server not reachable**: Start with `cd $DAEMON_PATH && npm run dev`

Remind the user to **restart Claude Code** to activate the newly installed hooks.
