'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { SessionOverview } from '@/features/session/ui/SessionOverview';
import { SessionConsole } from '@/features/session/ui/SessionConsole';
import { TimelineView } from '@/features/timeline/ui/TimelineView';
import { FailureTimeline } from '@/features/failures/ui/FailureTimeline';
import { ImprovementsList } from '@/features/improvements/ui/ImprovementsList';
import type { Session, RawSession } from '@/entities/session/model';
import { normalizeSession } from '@/entities/session/model';

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
      {/* Tabs */}
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

      {/* Tab content */}
      {activeTab === 'overview' && <SessionOverview session={session} />}
      {activeTab === 'timeline' && <TimelineView sessionId={sessionId} />}
      {activeTab === 'failures' && <FailureTimeline sessionId={sessionId} />}
      {activeTab === 'improvements' && <ImprovementsList sessionId={sessionId} />}
      {activeTab === 'console' && <SessionConsole sessionId={sessionId} />}
    </div>
  );
}
