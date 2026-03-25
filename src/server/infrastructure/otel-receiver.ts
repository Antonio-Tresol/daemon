import { v4 as uuidv4 } from 'uuid';
import type { HookEvent, EventType } from '../domain/event/event.entity';

/**
 * Represents an OTLP/HTTP JSON log record.
 * Simplified to the fields we care about.
 */
interface OtlpLogRecord {
  timeUnixNano?: string;
  severityText?: string;
  body?: { stringValue?: string };
  attributes?: Array<{
    key: string;
    value: { stringValue?: string; intValue?: string; boolValue?: boolean };
  }>;
}

interface OtlpMetricDataPoint {
  timeUnixNano?: string;
  asDouble?: number;
  asInt?: string;
  attributes?: Array<{
    key: string;
    value: { stringValue?: string };
  }>;
}

interface OtlpMetric {
  name: string;
  gauge?: { dataPoints: OtlpMetricDataPoint[] };
  sum?: { dataPoints: OtlpMetricDataPoint[] };
  histogram?: { dataPoints: OtlpMetricDataPoint[] };
}

export interface OtlpLogsPayload {
  resourceLogs?: Array<{
    scopeLogs?: Array<{
      logRecords?: OtlpLogRecord[];
    }>;
  }>;
}

export interface OtlpMetricsPayload {
  resourceMetrics?: Array<{
    scopeMetrics?: Array<{
      metrics?: OtlpMetric[];
    }>;
  }>;
}

export interface ParsedOtelMetric {
  id: string;
  sessionId: string | null;
  metricName: string;
  metricValue: number;
  timestamp: string;
  attributes: Record<string, string>;
}

function nanoToIso(nanoStr: string | undefined): string {
  if (!nanoStr) return new Date().toISOString();
  const ms = Number(BigInt(nanoStr) / BigInt(1_000_000));
  return new Date(ms).toISOString();
}

function extractAttribute(
  attrs: OtlpLogRecord['attributes'],
  key: string,
): string | null {
  if (!attrs) return null;
  const found = attrs.find((a) => a.key === key);
  if (!found) return null;
  return found.value.stringValue ?? found.value.intValue ?? null;
}

export function parseOtlpLogs(payload: OtlpLogsPayload): HookEvent[] {
  const events: HookEvent[] = [];

  for (const resourceLog of payload.resourceLogs ?? []) {
    for (const scopeLog of resourceLog.scopeLogs ?? []) {
      for (const record of scopeLog.logRecords ?? []) {
        const timestamp = nanoToIso(record.timeUnixNano);
        const sessionId =
          extractAttribute(record.attributes, 'session.id') ?? 'unknown';
        const rawEventType =
          extractAttribute(record.attributes, 'event.type') ?? 'api_request';
        const toolName = extractAttribute(record.attributes, 'tool.name');

        const bodyText = record.body?.stringValue ?? '';
        let bodyPayload: Record<string, unknown> = {};
        try {
          bodyPayload = JSON.parse(bodyText) as Record<string, unknown>; // JSON.parse returns unknown
        } catch {
          bodyPayload = { raw: bodyText };
        }

        const costUsd = typeof bodyPayload.cost_usd === 'number' ? bodyPayload.cost_usd : 0;

        const event: HookEvent = {
          id: uuidv4(),
          sessionId,
          timestamp,
          eventType: rawEventType as EventType, // OTel attribute is string, narrowing to union type
          toolName,
          success: record.severityText !== 'ERROR',
          durationMs: null,
          promptId: extractAttribute(record.attributes, 'prompt.id'),
          payload: bodyPayload,
          costUsd,
        };

        events.push(event);
      }
    }
  }

  return events;
}

export function parseOtlpMetrics(
  payload: OtlpMetricsPayload,
): ParsedOtelMetric[] {
  const metrics: ParsedOtelMetric[] = [];

  for (const resourceMetric of payload.resourceMetrics ?? []) {
    for (const scopeMetric of resourceMetric.scopeMetrics ?? []) {
      for (const metric of scopeMetric.metrics ?? []) {
        const dataPoints =
          metric.gauge?.dataPoints ??
          metric.sum?.dataPoints ??
          metric.histogram?.dataPoints ??
          [];

        for (const dp of dataPoints) {
          const attrs: Record<string, string> = {};
          for (const a of dp.attributes ?? []) {
            if (a.value.stringValue) {
              attrs[a.key] = a.value.stringValue;
            }
          }

          metrics.push({
            id: uuidv4(),
            sessionId: attrs['session.id'] ?? null,
            metricName: metric.name,
            metricValue:
              dp.asDouble ?? (dp.asInt ? Number(dp.asInt) : 0),
            timestamp: nanoToIso(dp.timeUnixNano),
            attributes: attrs,
          });
        }
      }
    }
  }

  return metrics;
}
