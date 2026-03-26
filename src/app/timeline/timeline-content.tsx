'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RawSession, Session } from '@/entities/session/model';
import { normalizeSession } from '@/entities/session/model';
import { AnalyzeButton } from '@/features/session/ui/AnalyzeButton';
import { TimelineView } from '@/features/timeline/ui/TimelineView';
import { useWebSocket } from '@/shared/hooks/use-websocket';
import { EditableText } from '@/shared/ui/EditableText';
import { GroupFilter } from '@/shared/ui/GroupFilter';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';

export function TimelineContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [analysisGeneration, setAnalysisGeneration] = useState(0);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    subscribe('analysis');
  }, [subscribe]);

  useEffect(() => {
    fetch('/api/sessions?limit=50')
      .then((res) => res.json())
      .then((data: { sessions: RawSession[] }) => {
        const normalized = (data.sessions ?? [])
          .map(normalizeSession)
          .sort((a, b) => (b.totalEvents ?? 0) - (a.totalEvents ?? 0));
        setSessions(normalized);
        if (normalized.length > 0) {
          setSelectedSessionId(normalized[0].id);
        }
      })
      .catch(() => {
        // silently fail
      });
  }, []);

  const filteredSessions = useMemo(() => {
    if (!groupFilter) return sessions;
    return sessions.filter((s) => s.groupLabel === groupFilter);
  }, [sessions, groupFilter]);

  // When group filter changes and selected session is no longer visible, select first in filtered list
  useEffect(() => {
    if (filteredSessions.length > 0) {
      const currentInList = filteredSessions.some((s) => s.id === selectedSessionId);
      if (!currentInList) {
        setSelectedSessionId(filteredSessions[0].id);
      }
    }
  }, [filteredSessions, selectedSessionId]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const handleRename = useCallback(
    (newName: string) => {
      if (!selectedSessionId) return;
      fetch(`/api/sessions/${selectedSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
        .then((res) => res.json())
        .then(() => {
          setSessions((prev) =>
            prev.map((s) => (s.id === selectedSessionId ? { ...s, name: newName || null } : s)),
          );
        })
        .catch(() => {
          // silently fail
        });
    },
    [selectedSessionId],
  );

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <GroupFilter value={groupFilter} onChange={setGroupFilter} />

        {filteredSessions.length > 0 && (
          <select
            value={selectedSessionId ?? ''}
            onChange={(e) => setSelectedSessionId(e.target.value || undefined)}
            className="rounded-md border border-border bg-depth-1 px-3 py-2 text-sm font-mono text-text-primary outline-none focus:border-ember transition-colors duration-300"
          >
            <option value="">All sessions</option>
            {filteredSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.status === 'active' ? '\u25CF ' : ''}
                {s.name ?? s.id.slice(0, 12)} ({s.totalEvents} events)
              </option>
            ))}
          </select>
        )}

        {selectedSession && (
          <div className="flex items-center gap-1.5">
            <StatusIndicator status={selectedSession.status} />
            <EditableText
              value={selectedSession.name ?? ''}
              placeholder={selectedSession.id.slice(0, 12)}
              onSave={handleRename}
            />
          </div>
        )}

        {selectedSessionId && (
          <AnalyzeButton
            sessionId={selectedSessionId}
            onComplete={() => setAnalysisGeneration((g) => g + 1)}
          />
        )}

        {selectedSession && (
          <span className="text-xs font-mono text-text-muted ml-auto">
            {selectedSession.totalEvents} events captured
          </span>
        )}
      </div>

      <TimelineView key={`tl-${analysisGeneration}`} sessionId={selectedSessionId} />
    </div>
  );
}
