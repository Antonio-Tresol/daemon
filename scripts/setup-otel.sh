#!/bin/bash
# Setup OpenTelemetry environment variables for Claude Code monitoring
# Usage: source scripts/setup-otel.sh
#
# This must be sourced (not executed) so the env vars persist in your shell.

SERVER_URL="${CCC_SERVER_URL:-http://localhost:3000}"

export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_ENDPOINT="$SERVER_URL/api/otel"
export OTEL_LOG_USER_PROMPTS=1
export OTEL_LOG_TOOL_DETAILS=1
export OTEL_METRIC_EXPORT_INTERVAL=10000
export OTEL_LOGS_EXPORT_INTERVAL=5000

echo "=== Claude Code OTel Configuration ==="
echo "Telemetry:     ENABLED"
echo "Exporter:      OTLP/HTTP (JSON)"
echo "Endpoint:      $SERVER_URL/api/otel"
echo "User prompts:  LOGGED"
echo "Tool details:  LOGGED"
echo "Metrics interval: 10s"
echo "Logs interval:    5s"
echo ""
echo "Start Claude Code in this shell to begin sending telemetry."
