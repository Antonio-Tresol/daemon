'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { ImprovementCard } from '@/features/improvements/ui/ImprovementCard';
import { useImprovements } from '@/features/improvements/model/use-improvements';
import { AnalysisBadge } from '@/entities/analysis/ui/AnalysisBadge';
import type { Improvement, ImprovementArea } from '@/entities/analysis/model';

type ImprovementsListProps = {
  sessionId?: string;
  className?: string;
};

const AREA_ORDER: ImprovementArea[] = [
  'hooks', 'context', 'subagents', 'architecture', 'tools', 'skills', 'legibility',
];

type AreaMeta = { label: string; color: string; desc: string };

const areaMeta: Record<ImprovementArea, AreaMeta> = {
  hooks: { label: 'Hooks', color: '#d4a574', desc: 'Pre/post tool hooks and automation' },
  skills: { label: 'Skills', color: '#9b8aed', desc: 'Reusable agent capabilities' },
  subagents: { label: 'Agent Teams', color: '#4a9e6d', desc: 'Parallel work strategies' },
  tools: { label: 'MCP Tools', color: '#6b8aed', desc: 'External tool integration' },
  context: { label: 'CLAUDE.md', color: '#d4a040', desc: 'Context and documentation' },
  architecture: { label: 'Architecture', color: '#c45a5a', desc: 'Structure enforcement' },
  legibility: { label: 'Legibility', color: '#8a8078', desc: 'Agent readability' },
};

type ViewMode = 'priority' | 'category';

function priorityScore(imp: Improvement): number {
  const severityScore = imp.severity === 'high' ? 3 : imp.severity === 'medium' ? 2 : 1;
  const effortScore = imp.effort?.includes('2m') || imp.effort?.includes('5m') ? 3
    : imp.effort?.includes('10m') || imp.effort?.includes('15m') ? 2 : 1;
  return severityScore * 2 + effortScore;
}

function QuickWinBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium uppercase tracking-wider text-status-green bg-status-green/10 px-1.5 py-0.5 rounded">
      quick win
    </span>
  );
}

export function ImprovementsList({ sessionId, className }: ImprovementsListProps) {
  const { improvements, analysis, isLoading, error } = useImprovements(sessionId);
  const [viewMode, setViewMode] = useState<ViewMode>('priority');
  const [filterArea, setFilterArea] = useState<ImprovementArea | null>(null);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <span className="text-sm text-muted">Loading improvements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-xl border border-status-red/30 bg-status-red/5 p-4', className)}>
        <p className="text-sm text-status-red">Failed to load: {error}</p>
      </div>
    );
  }

  if (improvements.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <svg className="h-8 w-8 text-accent mb-2" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Clean</title><path d="M8 2l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" /></svg>
        <p className="text-sm text-muted">No suggestions yet</p>
      </div>
    );
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
  const quickWins = prioritySorted.filter((imp) => imp.severity === 'high' && (imp.effort?.includes('2m') || imp.effort?.includes('5m')));

  const filtered = filterArea
    ? (viewMode === 'priority' ? prioritySorted : improvements).filter((imp) => imp.area === filterArea)
    : viewMode === 'priority' ? prioritySorted : improvements;

  const highCount = improvements.filter((i) => i.severity === 'high').length;
  const medCount = improvements.filter((i) => i.severity === 'medium').length;
  const lowCount = improvements.filter((i) => i.severity === 'low').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary row */}
      <div className="flex items-center gap-4 flex-wrap">
        {analysis && <AnalysisBadge status={analysis.status} />}
        <span className="text-xs text-muted">{improvements.length} suggestions</span>

        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-status-red" />
          {highCount} high
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-status-amber" />
          {medCount} med
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          {lowCount} low
        </div>

        {quickWins.length > 0 && (
          <QuickWinBadge />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border border-card-border bg-card">
          <button
            type="button"
            onClick={() => setViewMode('priority')}
            className={cn(
              'px-3 py-1 text-xs rounded-l-lg transition-colors',
              viewMode === 'priority' ? 'bg-accent/15 text-accent font-medium' : 'text-muted hover:text-foreground',
            )}
          >
            Priority
          </button>
          <button
            type="button"
            onClick={() => setViewMode('category')}
            className={cn(
              'px-3 py-1 text-xs rounded-r-lg border-l border-card-border transition-colors',
              viewMode === 'category' ? 'bg-accent/15 text-accent font-medium' : 'text-muted hover:text-foreground',
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
            className={cn(
              'px-2 py-0.5 text-[10px] rounded-full transition-colors',
              filterArea === null ? 'bg-card-border/60 text-foreground' : 'text-muted hover:text-foreground',
            )}
          >
            All
          </button>
          {AREA_ORDER.filter((area) => grouped.has(area)).map((area) => {
            const meta = areaMeta[area];
            return (
              <button
                key={area}
                type="button"
                onClick={() => setFilterArea(filterArea === area ? null : area)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full transition-colors',
                  filterArea === area ? 'text-foreground' : 'text-muted hover:text-foreground',
                )}
                style={filterArea === area ? { background: `${meta.color}20` } : undefined}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                {meta.label}
                <span className="text-muted">({grouped.get(area)?.length})</span>
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
            const meta = areaMeta[area];

            return (
              <div key={area}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: meta.color }} />
                  <h3 className="text-xs font-medium text-foreground">{meta.label}</h3>
                  <span className="text-[10px] text-muted">{meta.desc}</span>
                  <span className="text-[10px] text-muted ml-auto">({items.length})</span>
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
