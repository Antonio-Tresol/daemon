'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TimelineView } from '@/features/timeline/ui/TimelineView';
import { useWebSocket } from '@/shared/hooks/use-websocket';
import type { Session, RawSession } from '@/entities/session/model';
import { normalizeSession } from '@/entities/session/model';
import { GroupFilter } from '@/shared/ui/GroupFilter';
import { EditableText } from '@/shared/ui/EditableText';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';

const LEVELS = [
  { value: 0, label: 'L0: Events', description: 'Raw events grouped into plans & tasks' },
  { value: 1, label: 'L1: Phases', description: 'Plans grouped into phases & milestones' },
  { value: 2, label: 'L2: Narrative', description: 'Session narrative summary' },
] as const;

export function TimelineContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const [level, setLevel] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingType, setAnalyzingType] = useState<string | null>(null);
  const [analysisKey, setAnalysisKey] = useState(0);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    subscribe('analysis');
  }, [subscribe]);

  useEffect(() => {
    fetch('/api/sessions?limit=50')
      .then((res) => res.json())
      .then((data: { sessions: RawSession[] }) => {
        const normalized = (data.sessions ?? []).map(normalizeSession)
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

  const handleRerunAnalysis = useCallback(async (targetLevel?: number) => {
    if (!selectedSessionId || isAnalyzing) return;
    setIsAnalyzing(true);
    const lvl = targetLevel ?? level;
    setAnalyzingType(`Level ${lvl}`);

    try {
      // For level > 0, ensure previous level exists first
      if (lvl > 0) {
        const check = await fetch(`/api/analysis?sessionId=${selectedSessionId}&type=timeline&level=${lvl - 1}&limit=1`);
        const checkData = await check.json();
        const hasLower = (checkData.analyses ?? []).some(
          (a: Record<string, unknown>) => a.status === 'completed',
        );

        if (!hasLower) {
          setAnalyzingType(`Building Level ${lvl - 1} first...`);
          await fetch('/api/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: selectedSessionId, type: 'timeline', level: lvl - 1 }),
          });
        }
      }

      const types = lvl === 0
        ? ['timeline', 'failures', 'improvements'] as const
        : ['timeline'] as const;

      for (const type of types) {
        setAnalyzingType(`${type} (Level ${lvl})`);
        await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: selectedSessionId, type, level: lvl }),
        });
      }

      setAnalysisKey((k) => k + 1);
    } catch {
      // silently fail
    } finally {
      setIsAnalyzing(false);
      setAnalyzingType(null);
    }
  }, [selectedSessionId, isAnalyzing, level]);

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

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <GroupFilter value={groupFilter} onChange={setGroupFilter} />

        {filteredSessions.length > 0 && (
          <select
            value={selectedSessionId ?? ''}
            onChange={(e) => setSelectedSessionId(e.target.value || undefined)}
            className="rounded-sm border border-border bg-depth-1 px-3 py-2 text-sm font-mono text-text-primary outline-none focus:border-signal-green transition-colors duration-300"
          >
            <option value="">All sessions</option>
            {filteredSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.status === 'active' ? '\u25CF ' : ''}{s.name ?? s.id.slice(0, 12)} ({s.totalEvents} events)
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

        {/* Matryoshka Level Selector */}
        {selectedSessionId && (
          <div className="flex items-center border border-border bg-depth-1 overflow-hidden">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                title={l.description}
                className={`px-3 py-2 text-xs font-mono font-medium transition-colors duration-300 ${
                  level === l.value
                    ? 'bg-signal-green/10 text-signal-green'
                    : 'text-text-secondary hover:text-text-primary hover:bg-depth-2'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        {selectedSessionId && (
          <button
            type="button"
            onClick={() => handleRerunAnalysis()}
            disabled={isAnalyzing}
            className="border border-signal-green/40 bg-transparent px-3 py-2 text-xs font-mono font-medium text-signal-green hover:bg-signal-green/10 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing
              ? `Analyzing: ${analyzingType}...`
              : `Rerun Level ${level}`}
          </button>
        )}

        {selectedSession && (
          <span className="text-xs font-mono text-text-muted ml-auto">
            {selectedSession.totalEvents} events captured
          </span>
        )}
      </div>

      <TimelineView key={`${analysisKey}-${level}`} sessionId={selectedSessionId} level={level} />
    </div>
  );
}
