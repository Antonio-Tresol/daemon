'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import type { Improvement, ImprovementArea } from '@/entities/analysis/model';

type ImprovementCardProps = {
  improvement: Improvement;
  isQuickWin?: boolean;
  className?: string;
};

function severityVariant(severity: Improvement['severity']) {
  switch (severity) {
    case 'high': return 'error' as const;
    case 'medium': return 'warning' as const;
    case 'low': return 'info' as const;
  }
}

const AREA_META: Record<ImprovementArea, { label: string; icon: string }> = {
  hooks: { label: 'Hooks', icon: '{ }' },
  skills: { label: 'Skills', icon: '/ /' },
  subagents: { label: 'Agent Teams', icon: '>>>' },
  tools: { label: 'MCP Tools', icon: '::' },
  context: { label: 'CLAUDE.md', icon: '#' },
  architecture: { label: 'Architecture', icon: '|||' },
  legibility: { label: 'Legibility', icon: '...' },
};

export function ImprovementCard({ improvement, isQuickWin, className }: ImprovementCardProps) {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const meta = AREA_META[improvement.area] ?? { label: improvement.area, icon: '?' };

  function handleCopyConfig() {
    if (!improvement.config) return;
    navigator.clipboard
      .writeText(JSON.stringify(improvement.config, null, 2))
      .then(() => {
        setCopiedConfig(true);
        setTimeout(() => setCopiedConfig(false), 2000);
      })
      .catch(() => {
        // clipboard write failed silently
      });
  }

  return (
    <div className={cn('border border-border bg-signal-green/[0.03] overflow-hidden border-l-3 border-l-signal-green', isQuickWin && 'ring-1 ring-signal-green/30', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-depth-1/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-signal-green uppercase tracking-wider">
              ADVISORY — {improvement.category ?? meta.label}
            </span>
            <Badge variant={severityVariant(improvement.severity)} size="sm">
              {improvement.severity}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {improvement.effort && (
              <span className="text-[10px] font-mono text-text-muted bg-depth-2 px-2 py-0.5">
                {improvement.effort}
              </span>
            )}
            <span className="text-text-muted text-xs">{expanded ? '-' : '+'}</span>
          </div>
        </div>

        <p className="mt-2 text-sm text-text-primary">{improvement.suggestion}</p>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 depth-reveal">
          <div className="mt-3">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted mb-1">Problem</p>
            <p className="text-sm text-text-primary/80">{improvement.problem}</p>
          </div>

          {improvement.config && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted">
                  Configuration
                </p>
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="text-[10px] font-mono text-signal-green hover:text-signal-green/80 transition-colors"
                >
                  {copiedConfig ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="bg-depth-2 p-3 text-[11px] text-text-primary/70 font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(improvement.config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
