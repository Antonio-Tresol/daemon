'use client';

import { useCallback, useEffect, useState } from 'react';
import { TimelineView } from '@/features/timeline/ui/TimelineView';
import { useWebSocket } from '@/shared/hooks/use-websocket';
import type { Session, RawSession } from '@/entities/session/model';
import { normalizeSession } from '@/entities/session/model';

export function TimelineContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0);
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

  const handleRerunAnalysis = useCallback(async () => {
    if (!selectedSessionId || isAnalyzing) return;
    setIsAnalyzing(true);

    const types = ['timeline', 'failures', 'improvements'] as const;

    try {
      await Promise.all(
        types.map((type) =>
          fetch('/api/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: selectedSessionId, type }),
          }),
        ),
      );
      // Force refetch by bumping key
      setAnalysisKey((k) => k + 1);
    } catch {
      // silently fail
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedSessionId, isAnalyzing]);

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex items-center gap-3">
        {sessions.length > 0 && (
          <select
            value={selectedSessionId ?? ''}
            onChange={(e) => setSelectedSessionId(e.target.value || undefined)}
            className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">All sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id.slice(0, 8)} - {s.status} ({s.totalEvents} events)
              </option>
            ))}
          </select>
        )}

        {selectedSessionId && (
          <button
            type="button"
            onClick={handleRerunAnalysis}
            disabled={isAnalyzing}
            className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Analyzing...' : 'Rerun Analysis'}
          </button>
        )}
      </div>

      <TimelineView key={analysisKey} sessionId={selectedSessionId} />
    </div>
  );
}
