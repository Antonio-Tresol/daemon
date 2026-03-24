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
  hooks: { label: 'Hooks', color: '#00e5a0', desc: 'Pre/post tool hooks and automation' },
  skills: { label: 'Skills', color: '#4080e5', desc: 'Reusable agent capabilities' },
  subagents: { label: 'Agent Teams', color: '#00c5c0', desc: 'Parallel work strategies' },
  tools: { label: 'MCP Tools', color: '#0080e5', desc: 'External tool integration' },
  context: { label: 'CLAUDE.md', color: '#e5a040', desc: 'Context and documentation' },
  architecture: { label: 'Architecture', color: '#e54060', desc: 'Structure enforcement' },
  legibility: { label: 'Legibility', color: '#6b7f99', desc: 'Agent readability' },
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
    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-medium uppercase tracking-wider text-signal-green bg-signal-green/15 px-1.5 py-0.5">
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
      <div className={cn('border border-signal-red/30 bg-signal-red/5 p-4', className)}>
        <p className="text-sm text-signal-red">Failed to load: {error}</p>
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
        <span className="font-mono text-xs text-text-secondary">{improvements.length} suggestions</span>

        <div className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
          <span className="inline-block h-2 w-2 bg-signal-red" />
          {highCount} high
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
          <span className="inline-block h-2 w-2 bg-signal-amber" />
          {medCount} med
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
          <span className="inline-block h-2 w-2 bg-signal-green" />
          {lowCount} low
        </div>

        {quickWins.length > 0 && (
          <QuickWinBadge />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View mode toggle */}
        <div className="flex items-center border border-border bg-depth-1">
          <button
            type="button"
            onClick={() => setViewMode('priority')}
            className={cn(
              'px-3 py-1 text-xs transition-colors',
              viewMode === 'priority' ? 'bg-signal-green/15 text-signal-green font-medium' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            Priority
          </button>
          <button
            type="button"
            onClick={() => setViewMode('category')}
            className={cn(
              'px-3 py-1 text-xs border-l border-border transition-colors',
              viewMode === 'category' ? 'bg-signal-green/15 text-signal-green font-medium' : 'text-text-secondary hover:text-text-primary',
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
              'px-2 py-0.5 text-[10px] rounded-sm transition-colors',
              filterArea === null ? 'bg-border/60 text-text-primary' : 'text-text-secondary hover:text-text-primary',
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
                  'flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-sm transition-colors',
                  filterArea === area ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary',
                )}
                style={filterArea === area ? { background: `${meta.color}20` } : undefined}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-sm" style={{ background: meta.color }} />
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
