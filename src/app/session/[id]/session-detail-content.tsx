'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import type { RawSession, Session } from '@/entities/session/model';
import { normalizeSession } from '@/entities/session/model';
import { FailureTimeline } from '@/features/failures/ui/FailureTimeline';
import { ImprovementsList } from '@/features/improvements/ui/ImprovementsList';
import { AnalyzeButton } from '@/features/session/ui/AnalyzeButton';
import { SessionConsole } from '@/features/session/ui/SessionConsole';
import { SessionOverview } from '@/features/session/ui/SessionOverview';
import { TimelineView } from '@/features/timeline/ui/TimelineView';

type SessionDetailContentProps = {
  sessionId: string;
  className?: string;
};

type Tab = 'overview' | 'timeline' | 'failures' | 'improvements' | 'console';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'failures', label: 'Failures' },
  { key: 'improvements', label: 'Improvements' },
  { key: 'console', label: 'Console' },
];

export function SessionDetailContent({ sessionId, className }: SessionDetailContentProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [analysisGeneration, setAnalysisGeneration] = useState(0);

  useEffect(() => {
    fetch(`/api/sessions?limit=200`)
      .then((res) => res.json())
      .then((data: { sessions: RawSession[] }) => {
        const normalized = (data.sessions ?? []).map(normalizeSession);
        const found = normalized.find((s) => s.id === sessionId);
        setSession(found ?? null);
      })
      .catch(() => {
        // silently fail
      })
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-muted">Loading session...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted">Session not found.</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Tabs + Analyze button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 border-b border-card-border pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'rounded-t-lg px-4 py-2 text-sm transition-colors',
                activeTab === tab.key
                  ? 'border-b-2 border-accent text-accent font-medium'
                  : 'text-muted hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <AnalyzeButton
          sessionId={sessionId}
          onComplete={() => setAnalysisGeneration((g) => g + 1)}
        />
      </div>

      {/* Tab content — key includes analysisGeneration to force refetch on analysis complete */}
      {activeTab === 'overview' && <SessionOverview session={session} />}
      {activeTab === 'timeline' && (
        <TimelineView key={`tl-${analysisGeneration}`} sessionId={sessionId} />
      )}
      {activeTab === 'failures' && (
        <FailureTimeline key={`fl-${analysisGeneration}`} sessionId={sessionId} />
      )}
      {activeTab === 'improvements' && (
        <ImprovementsList key={`im-${analysisGeneration}`} sessionId={sessionId} />
      )}
      {activeTab === 'console' && <SessionConsole sessionId={sessionId} />}
    </div>
  );
}
