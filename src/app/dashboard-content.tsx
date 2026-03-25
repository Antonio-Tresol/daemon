'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';
import { EventBadge } from '@/entities/event/ui/EventBadge';
import { useWebSocket } from '@/shared/hooks/use-websocket';
import { formatTimestamp, formatDuration, formatCost } from '@/shared/lib/format';
import type { Session, RawSession } from '@/entities/session/model';
import { normalizeSession } from '@/entities/session/model';
import type { HookEvent } from '@/entities/event/model';

type DashboardStats = {
  activeSessions: number;
  totalEvents: number;
  totalCost: number;
};

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    activeSessions: 0,
    totalEvents: 0,
    totalCost: 0,
  });
  const [recentEvents, setRecentEvents] = useState<HookEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, lastMessage, subscribe } = useWebSocket();

  // Subscribe to channels
  useEffect(() => {
    subscribe('events');
    subscribe('sessions');
  }, [subscribe]);

  // Fetch initial data
  useEffect(() => {
    async function load() {
      try {
        const [sessionsRes, eventsRes] = await Promise.all([
          fetch('/api/sessions?limit=10'),
          fetch('/api/events?limit=20'),
        ]);

        if (sessionsRes.ok) {
          const rawData = (await sessionsRes.json()) as { sessions: RawSession[] }; // fetch .json() returns unknown
          const normalized = (rawData.sessions ?? []).map(normalizeSession);
          setSessions(normalized);
          const active = normalized.filter((s) => s.status === 'active');
          const totalCost = normalized.reduce((sum, s) => sum + (s.totalCostUsd ?? 0), 0);
          setStats((prev) => ({
            ...prev,
            activeSessions: active.length,
            totalCost,
          }));
        }

        if (eventsRes.ok) {
          const data = (await eventsRes.json()) as { events: Array<Record<string, unknown>>; count: number }; // fetch .json() returns unknown
          // Record<string, unknown> values narrowed to expected field types
          const normalizedEvents: HookEvent[] = (data.events ?? []).map((e) => ({
            id: e.id as string,
            sessionId: (e.session_id ?? e.sessionId) as string,
            timestamp: e.timestamp as string,
            eventType: (e.event_type ?? e.eventType) as HookEvent['eventType'],
            toolName: (e.tool_name ?? e.toolName ?? null) as string | null,
            success: (e.success ?? null) as boolean | null,
            durationMs: (e.duration_ms ?? e.durationMs ?? null) as number | null,
            promptId: (e.prompt_id ?? e.promptId ?? null) as string | null,
            payload: (e.payload ?? {}) as Record<string, unknown>,
          }));
          setRecentEvents(normalizedEvents);
          setStats((prev) => ({ ...prev, totalEvents: data.count ?? 0 }));
        }
      } catch {
        // silently fail on initial load
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.channel === 'events') {
      const event = lastMessage.data as HookEvent; // WebSocket message data is unknown
      setRecentEvents((prev) => [event, ...prev].slice(0, 20));
      setStats((prev) => ({ ...prev, totalEvents: prev.totalEvents + 1 }));
    }
  }, [lastMessage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-text-muted">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-secondary">
            Active Sessions
          </p>
          <p className="mt-1 text-2xl font-mono font-semibold text-text-primary">
            {stats.activeSessions}
          </p>
        </Card>
        <Card>
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-secondary">
            Total Events
          </p>
          <p className="mt-1 text-2xl font-mono font-semibold text-text-primary">
            {stats.totalEvents}
          </p>
        </Card>
        <Card>
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-secondary">
            Total Cost
          </p>
          <p className="mt-1 text-2xl font-mono font-semibold text-text-primary">
            {formatCost(stats.totalCost)}
          </p>
        </Card>
        <Card>
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-secondary">
            WebSocket
          </p>
          <div className="mt-1 flex items-center gap-2">
            <StatusIndicator status={isConnected ? 'active' : 'error'} />
            <span className="text-sm font-mono text-text-primary">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent events */}
        <Card title="Recent Events" subtitle="Last 20 events across all sessions">
          {recentEvents.length === 0 ? (
            <p className="py-8 text-center text-xs text-text-muted">No events yet</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-depth-2/50 transition-colors"
                >
                  <EventBadge eventType={event.eventType} />
                  {event.toolName && (
                    <span className="font-mono text-text-primary/70 truncate max-w-[100px]">
                      {event.toolName}
                    </span>
                  )}
                  {event.durationMs !== null && (
                    <span className="text-text-muted">{formatDuration(event.durationMs)}</span>
                  )}
                  {event.success === false && (
                    <Badge variant="error" size="sm">fail</Badge>
                  )}
                  <span className="ml-auto text-[10px] text-text-muted whitespace-nowrap">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sessions */}
        <Card title="Sessions" subtitle="Recent Claude Code sessions">
          {sessions.length === 0 ? (
            <p className="py-8 text-center text-xs text-text-muted">No sessions yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/session/${session.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-depth-2/50 transition-colors"
                >
                  <StatusIndicator
                    status={session.status === 'active' ? 'active' : session.status === 'error' ? 'error' : 'completed'}
                  />
                  <span className="font-mono font-medium text-text-primary">
                    {session.id.slice(0, 8)}
                  </span>
                  <Badge
                    variant={session.status === 'active' ? 'success' : session.status === 'error' ? 'error' : 'neutral'}
                    size="sm"
                  >
                    {session.status}
                  </Badge>
                  <span className="text-text-muted">{session.totalEvents} events</span>
                  <span className="ml-auto text-text-muted">
                    {formatTimestamp(session.startTime)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { label: 'Timeline', href: '/timeline', desc: 'Session activity plans' },
          { label: 'Harness', href: '/improvements', desc: 'Failures & improvements' },
          { label: 'Sessions', href: '/sessions', desc: 'All sessions' },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:border-ember/30 transition-colors">
              <p className="text-sm font-medium text-text-primary">{link.label}</p>
              <p className="mt-0.5 text-xs font-mono text-text-secondary">{link.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
