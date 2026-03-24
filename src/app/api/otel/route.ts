import { NextRequest, NextResponse } from 'next/server';

type OtelLogRecord = {
  body?: { stringValue?: string };
  attributes?: Array<{
    key: string;
    value: { stringValue?: string; intValue?: string; boolValue?: boolean };
  }>;
  timeUnixNano?: string;
  observedTimeUnixNano?: string;
};

type OtelMetricDataPoint = {
  asInt?: string;
  asDouble?: number;
  startTimeUnixNano?: string;
  timeUnixNano?: string;
  attributes?: Array<{
    key: string;
    value: { stringValue?: string; intValue?: string };
  }>;
};

type OtelMetric = {
  name: string;
  unit?: string;
  sum?: { dataPoints: OtelMetricDataPoint[] };
  gauge?: { dataPoints: OtelMetricDataPoint[] };
  histogram?: { dataPoints: OtelMetricDataPoint[] };
};

function extractAttributes(
  attrs: Array<{ key: string; value: { stringValue?: string; intValue?: string; boolValue?: boolean } }> | undefined,
): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  if (!attrs) return result;
  for (const attr of attrs) {
    if (attr.value.stringValue !== undefined) {
      result[attr.key] = attr.value.stringValue;
    } else if (attr.value.intValue !== undefined) {
      result[attr.key] = attr.value.intValue;
    } else if (attr.value.boolValue !== undefined) {
      result[attr.key] = attr.value.boolValue;
    }
  }
  return result;
}

function nanoToIso(nanoStr: string | undefined): string {
  if (!nanoStr) return new Date().toISOString();
  const ms = Number(BigInt(nanoStr) / BigInt(1_000_000));
  return new Date(ms).toISOString();
}

// OTLP/HTTP Logs endpoint
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('json')) {
      return NextResponse.json(
        { error: 'Only application/json (OTLP/HTTP JSON) is supported' },
        { status: 415 },
      );
    }

    const body = await request.json();
    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    let ingested = 0;

    // Handle logs/events export format
    if (body.resourceLogs) {
      for (const resourceLog of body.resourceLogs) {
        for (const scopeLog of resourceLog.scopeLogs ?? []) {
          for (const logRecord of (scopeLog.logRecords ?? []) as OtelLogRecord[]) {
            const attrs = extractAttributes(logRecord.attributes);
            const timestamp = nanoToIso(logRecord.timeUnixNano);
            const eventName = attrs['event.name'] as string ?? 'unknown';

            const event = {
              id: crypto.randomUUID(),
              sessionId: (attrs['session.id'] as string) ?? 'otel-unknown',
              timestamp,
              eventType: eventName,
              toolName: (attrs['tool_name'] as string) ?? null,
              success: attrs['success'] === 'true' ? 1 : attrs['success'] === 'false' ? 0 : null,
              durationMs: attrs['duration_ms'] ? Number(attrs['duration_ms']) : null,
              promptId: (attrs['prompt.id'] as string) ?? null,
              payload: JSON.stringify(attrs),
            };

            db.prepare(`
              INSERT INTO events (id, session_id, timestamp, event_type, tool_name, success, duration_ms, prompt_id, payload)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              event.id, event.sessionId, event.timestamp, event.eventType,
              event.toolName, event.success, event.durationMs, event.promptId, event.payload,
            );
            ingested++;
          }
        }
      }
    }

    // Handle metrics export format
    if (body.resourceMetrics) {
      for (const resourceMetric of body.resourceMetrics) {
        for (const scopeMetric of resourceMetric.scopeMetrics ?? []) {
          for (const metric of (scopeMetric.metrics ?? []) as OtelMetric[]) {
            const dataPoints = metric.sum?.dataPoints
              ?? metric.gauge?.dataPoints
              ?? metric.histogram?.dataPoints
              ?? [];

            for (const dp of dataPoints) {
              const value = dp.asDouble ?? (dp.asInt ? Number(dp.asInt) : 0);
              const timestamp = nanoToIso(dp.timeUnixNano);
              const attrs = extractAttributes(dp.attributes as OtelLogRecord['attributes']);

              db.prepare(`
                INSERT INTO otel_metrics (id, timestamp, metric_name, value, attributes)
                VALUES (?, ?, ?, ?, ?)
              `).run(
                crypto.randomUUID(),
                timestamp,
                metric.name,
                value,
                JSON.stringify(attrs),
              );
              ingested++;
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, ingested });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
