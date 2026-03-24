---
description: "Set up Claude Command Center monitoring in any codebase — install hooks, configure OTel, verify server"
---

# Onboard to Command Center

Set up Claude Code monitoring by installing hooks and configuring telemetry.

## Steps

### 1. Find Command Center installation

```bash
# Check env var first
echo "${COMMAND_CENTER_PATH:-not set}"

# Scan common locations
for dir in \
  "$HOME/Claude-Command-Center" \
  "$HOME/projects/Claude-Command-Center" \
  "$HOME/code/Claude-Command-Center" \
  "$HOME/Antonio-Uni/Claude-Command-Center" \
  "E:/Antonio-Uni/Claude-Command-Center"; do
  if [ -f "$dir/scripts/onboard.sh" ]; then
    echo "Found: $dir"
    break
  fi
done
```

If not found, ask the user for the path.

### 2. Run onboard script

```bash
bash $CC_PATH/scripts/onboard.sh
```

This installs hooks into `~/.claude/settings.json` (merging with existing hooks) and configures OTel env vars.

### 3. Verify setup

```bash
bash $CC_PATH/scripts/verify-setup.sh
```

All three checks should pass: hooks installed, OTel configured, server reachable.

### 4. Report results

Show the verification output. If anything failed:
- **Hooks not installed**: Re-run `bash $CC_PATH/scripts/setup-hooks.sh`
- **OTel not configured**: Run `source $CC_PATH/scripts/setup-otel.sh`
- **Server not reachable**: Start with `cd $CC_PATH && npm run dev`

Remind the user to **restart Claude Code** to activate the newly installed hooks.
