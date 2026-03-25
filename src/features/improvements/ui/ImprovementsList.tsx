'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { Improvement, ImprovementArea } from '@/entities/analysis/model';
import { AnalysisBadge } from '@/entities/analysis/ui/AnalysisBadge';
import { useImprovements } from '@/features/improvements/model/use-improvements';
import { ImprovementCard } from '@/features/improvements/ui/ImprovementCard';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';

type ImprovementsListProps = {
  sessionId?: string;
  className?: string;
};

const AREA_ORDER: ImprovementArea[] = [
  'hooks',
  'context',
  'subagents',
  'architecture',
  'tools',
  'skills',
  'legibility',
];

const AREA_ICONS: Record<ImprovementArea, { label: string; icon: string; desc: string }> = {
  hooks: { label: 'Hooks', icon: '{ }', desc: 'Pre/post tool hooks and automation' },
  skills: { label: 'Skills', icon: '/ /', desc: 'Reusable agent capabilities' },
  subagents: { label: 'Agent Teams', icon: '>>>', desc: 'Parallel work strategies' },
  tools: { label: 'MCP Tools', icon: '::', desc: 'External tool integration' },
  context: { label: 'CLAUDE.md', icon: '#', desc: 'Context and documentation' },
  architecture: { label: 'Architecture', icon: '|||', desc: 'Structure enforcement' },
  legibility: { label: 'Legibility', icon: '...', desc: 'Agent readability' },
};

type ViewMode = 'priority' | 'category';

function priorityScore(imp: Improvement): number {
  const severityScore = imp.severity === 'high' ? 3 : imp.severity === 'medium' ? 2 : 1;
  const effortScore =
    imp.effort?.includes('2m') || imp.effort?.includes('5m')
      ? 3
      : imp.effort?.includes('10m') || imp.effort?.includes('15m')
        ? 2
        : 1;
  return severityScore * 2 + effortScore;
}

function QuickWinBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-medium uppercase tracking-wider text-ember bg-ember/15 rounded-md px-1.5 py-0.5">
      quick win
    </span>
  );
}

export function ImprovementsList({ sessionId, className }: ImprovementsListProps) {
  const { improvements, analysis, isLoading, error } = useImprovements(sessionId);
  const [viewMode, setViewMode] = useState<ViewMode>('priority');
  const [filterArea, setFilterArea] = useState<ImprovementArea | null>(null);

  if (isLoading) {
    return <LoadingState message="Loading improvements..." className={className} />;
  }

  if (error) {
    return <ErrorState message={`Failed to load: ${error}`} className={className} />;
  }

  if (improvements.length === 0) {
    return <EmptyState message="No suggestions yet" icon={'\u2713'} className={className} />;
  }

  // Group by area
  const grouped = new Map<ImprovementArea, Improvement[]>();
  for (const imp of improvements) {
    const list = grouped.get(imp.area) ?? [];
    list.push(imp);
    grouped.set(imp.area, list);
  }

  // Priority sorted (quick wins first)
  const prioritySorted = [...improvements].sort((a, b) => priorityScore(b) - priorityScore(a));
  const quickWins = prioritySorted.filter(
    (imp) => imp.severity === 'high' && (imp.effort?.includes('2m') || imp.effort?.includes('5m')),
  );

  const filtered = filterArea
    ? (viewMode === 'priority' ? prioritySorted : improvements).filter(
        (imp) => imp.area === filterArea,
      )
    : viewMode === 'priority'
      ? prioritySorted
      : improvements;

  const highCount = improvements.filter((i) => i.severity === 'high').length;
  const medCount = improvements.filter((i) => i.severity === 'medium').length;
  const lowCount = improvements.filter((i) => i.severity === 'low').length;

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Summary row */}
      <div className="flex items-center gap-4 flex-wrap">
        {analysis && <AnalysisBadge status={analysis.status} />}
        <span className="font-mono text-xs text-text-secondary">
          {improvements.length} suggestions
        </span>

        <div className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
          <span className="text-ember">{'\u2717\u2717'}</span>
          {highCount} high
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
          <span className="text-ember">{'\u25C6'}</span>
          {medCount} med
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
          <span className="text-ember">{'\u25CB'}</span>
          {lowCount} low
        </div>

        {quickWins.length > 0 && <QuickWinBadge />}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View mode toggle */}
        <div className="flex items-center border border-border bg-depth-1 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('priority')}
            className={clsx(
              'px-3 py-1 text-xs transition-colors',
              viewMode === 'priority'
                ? 'bg-ember/15 text-ember font-medium'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            Priority
          </button>
          <button
            type="button"
            onClick={() => setViewMode('category')}
            className={clsx(
              'px-3 py-1 text-xs border-l border-border transition-colors',
              viewMode === 'category'
                ? 'bg-ember/15 text-ember font-medium'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            Category
          </button>
        </div>

        {/* Area filter pills */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterArea(null)}
            className={clsx(
              'px-2 py-0.5 text-[10px] rounded-sm transition-colors',
              filterArea === null
                ? 'bg-ember/15 text-ember'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            All
          </button>
          {AREA_ORDER.filter((area) => grouped.has(area)).map((area) => {
            const meta = AREA_ICONS[area];
            return (
              <button
                key={area}
                type="button"
                onClick={() => setFilterArea(filterArea === area ? null : area)}
                className={clsx(
                  'flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-sm transition-colors',
                  filterArea === area
                    ? 'bg-ember/15 text-ember'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                <span className="font-mono text-ember">{meta.icon}</span>
                {meta.label}
                <span className="text-text-muted">({grouped.get(area)?.length})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {viewMode === 'priority' ? (
        <div className="space-y-2">
          {filtered.map((imp, i) => (
            <ImprovementCard
              key={`${imp.area}-${imp.suggestion.slice(0, 20)}-${i}`}
              improvement={imp}
              isQuickWin={quickWins.includes(imp)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {AREA_ORDER.filter((area) => {
            if (filterArea) return area === filterArea;
            return grouped.has(area);
          }).map((area) => {
            const items = grouped.get(area);
            if (!items) return null;
            const meta = AREA_ICONS[area];

            return (
              <div key={area}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-ember text-xs">{meta.icon}</span>
                  <h3 className="text-xs font-medium text-text-primary">{meta.label}</h3>
                  <span className="text-[10px] text-text-muted">{meta.desc}</span>
                  <span className="text-[10px] text-text-muted ml-auto">({items.length})</span>
                </div>
                <div className="space-y-2 ml-4.5">
                  {items.map((imp, i) => (
                    <ImprovementCard
                      key={`${imp.area}-${i}`}
                      improvement={imp}
                      isQuickWin={quickWins.includes(imp)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
