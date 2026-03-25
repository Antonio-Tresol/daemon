import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  status: text('status').notNull().default('active'),
  cwd: text('cwd'),
  projectHash: text('project_hash'),
  totalEvents: integer('total_events').notNull().default(0),
  totalCostUsd: real('total_cost_usd').notNull().default(0),
  name: text('name'),
  groupLabel: text('group_label'),
});

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  timestamp: text('timestamp').notNull(),
  eventType: text('event_type').notNull(),
  toolName: text('tool_name'),
  success: integer('success', { mode: 'boolean' }),
  durationMs: integer('duration_ms'),
  promptId: text('prompt_id'),
  payload: text('payload', { mode: 'json' }).notNull().default('{}'),
});

export const analyses = sqliteTable('analyses', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  analysisType: text('analysis_type').notNull(),
  level: integer('level').notNull().default(0),
  triggeredAt: text('triggered_at').notNull(),
  completedAt: text('completed_at'),
  status: text('status').notNull().default('pending'),
  result: text('result', { mode: 'json' }),
  error: text('error'),
});

export const otelMetrics = sqliteTable('otel_metrics', {
  id: text('id').primaryKey(),
  sessionId: text('session_id'),
  metricName: text('metric_name').notNull(),
  metricValue: real('metric_value').notNull(),
  timestamp: text('timestamp').notNull(),
  attributes: text('attributes', { mode: 'json' }).notNull().default('{}'),
});
