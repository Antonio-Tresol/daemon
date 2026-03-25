'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { FailureTimeline } from '@/features/failures/ui/FailureTimeline';
import { ImprovementsList } from '@/features/improvements/ui/ImprovementsList';
import { GroupFilter } from '@/shared/ui/GroupFilter';
import { EditableText } from '@/shared/ui/EditableText';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';

type SessionSummary = {
  id: string;
  total_events: number;
  start_time: string;
  status: string;
  name: string | null;
  group_label: string | null;
};

type SessionsResponse = {
  sessions: SessionSummary[];
};

type HarnessTab = 'failures' | 'improvements';

type HarnessContentProps = {
  className?: string;
};

export function HarnessContent({ className }: HarnessContentProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HarnessTab>('failures');
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const loadSessions = useCallback(() => {
    setSessionsLoading(true);
    fetch('/api/sessions?limit=50')
      .then((res) => res.json())
      .then((data: SessionsResponse) => {
        const sorted = (data.sessions ?? []).sort(
          (a, b) => b.total_events - a.total_events,
        );
        setSessions(sorted);
        if (sorted.length > 0 && !selectedSessionId) {
          setSelectedSessionId(sorted[0].id);
        }
      })
      .catch(() => {
        // silently fail
      })
      .finally(() => setSessionsLoading(false));
  }, [selectedSessionId]);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSessions = useMemo(() => {
    if (!groupFilter) return sessions;
    return sessions.filter((s) => s.group_label === groupFilter);
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
            prev.map((s) =>
              s.id === selectedSessionId ? { ...s, name: newName || null } : s,
            ),
          );
        })
        .catch(() => {
          // silently fail
        });
    },
    [selectedSessionId],
  );

  const tabs: { key: HarnessTab; label: string; icon: string }[] = [
    { key: 'failures', label: 'Failures', icon: '!' },
    { key: 'improvements', label: 'Improvements', icon: '{*}' },
  ];

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Session selector */}
      <div className="flex flex-wrap items-center gap-4">
        <label
          htmlFor="harness-session-select"
          className="text-sm font-mono font-medium text-text-secondary uppercase tracking-wider"
        >
          Session
        </label>

        <GroupFilter value={groupFilter} onChange={setGroupFilter} />

        {sessionsLoading ? (
          <span className="text-xs text-text-muted">Loading sessions...</span>
        ) : filteredSessions.length === 0 ? (
          <span className="text-xs text-text-muted">No sessions found</span>
        ) : (
          <select
            id="harness-session-select"
            value={selectedSessionId ?? ''}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="border border-border bg-depth-1 rounded-md px-3 py-1.5 text-sm font-mono text-text-primary outline-none focus:border-ember/50 transition-colors max-w-md"
          >
            {filteredSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.status === 'active' ? '\u25CF ' : ''}{s.name ?? s.id.slice(0, 12)} ({s.total_events} events)
              </option>
            ))}
          </select>
        )}

        {selectedSession && (
          <div className="flex items-center gap-1.5">
            <StatusIndicator status={selectedSession.status === 'active' ? 'active' : 'completed'} />
            <EditableText
              value={selectedSession.name ?? ''}
              placeholder={selectedSession.id.slice(0, 12)}
              onSave={handleRename}
            />
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm transition-colors',
              activeTab === tab.key
                ? 'border-b-2 border-ember text-ember font-medium'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <span className="font-mono text-xs opacity-60">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'failures' && (
        <FailureTimeline sessionId={selectedSessionId} />
      )}
      {activeTab === 'improvements' && (
        <ImprovementsList sessionId={selectedSessionId} />
      )}
    </div>
  );
}
