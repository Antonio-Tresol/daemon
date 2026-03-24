'use client';

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

const areaLabels: Record<ImprovementArea, string> = {
  hooks: 'Hooks',
  skills: 'Skills',
  subagents: 'Agent Teams',
  tools: 'MCP Tools',
  context: 'CLAUDE.md & Context',
  architecture: 'Architecture Enforcement',
  legibility: 'Agent Legibility',
};

export function ImprovementsList({ sessionId, className }: ImprovementsListProps) {
  const { improvements, analysis, isLoading, error } = useImprovements(sessionId);

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
        <p className="text-sm text-status-red">Failed to load improvements: {error}</p>
      </div>
    );
  }

  if (improvements.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <p className="text-sm text-muted">No improvement suggestions yet.</p>
        <p className="mt-1 text-xs text-muted">
          Suggestions are generated after analyzing session patterns.
        </p>
      </div>
    );
  }

  // Group by area
  const grouped = new Map<Improvement['area'], Improvement[]>();
  for (const imp of improvements) {
    const list = grouped.get(imp.area) ?? [];
    list.push(imp);
    grouped.set(imp.area, list);
  }

  return (
    <div className={cn('space-y-6', className)}>
      {analysis && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Analysis status:</span>
          <AnalysisBadge status={analysis.status} />
          <span className="ml-2">
            {improvements.length} suggestion{improvements.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {AREA_ORDER.filter((area) => grouped.has(area)).map((area) => {
        const items = grouped.get(area);
        if (!items) return null;

        return (
          <div key={area}>
            <h3 className="mb-3 text-sm font-medium text-foreground">
              {areaLabels[area]}
              <span className="ml-2 text-xs text-muted">({items.length})</span>
            </h3>
            <div className="space-y-3">
              {items.map((imp, i) => (
                <ImprovementCard key={`${imp.area}-${i}`} improvement={imp} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
