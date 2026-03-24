'use client';

import { useEffect, useState } from 'react';
import { TimelineView } from '@/features/timeline/ui/TimelineView';
import { useWebSocket } from '@/shared/hooks/use-websocket';
import type { Session, RawSession } from '@/entities/session/model';
import { normalizeSession } from '@/entities/session/model';

export function TimelineContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const { subscribe } = useWebSocket();

  useEffect(() => {
    subscribe('analysis');
  }, [subscribe]);

  useEffect(() => {
    fetch('/api/sessions?limit=20')
      .then((res) => res.json())
      .then((data: { sessions: RawSession[] }) => {
        const normalized = (data.sessions ?? []).map(normalizeSession);
        setSessions(normalized);
        if (normalized.length > 0) {
          setSelectedSessionId(normalized[0].id);
        }
      })
      .catch(() => {
        // silently fail
      });
  }, []);

  return (
    <div className="space-y-4">
      {/* Session selector */}
      {sessions.length > 0 && (
        <select
          value={selectedSessionId ?? ''}
          onChange={(e) => setSelectedSessionId(e.target.value || undefined)}
          className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="">All sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id.slice(0, 8)} - {s.status}
            </option>
          ))}
        </select>
      )}

      <TimelineView sessionId={selectedSessionId} />
    </div>
  );
}
