'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import type { Improvement, ImprovementArea } from '@/entities/analysis/model';

type ImprovementCardProps = {
  improvement: Improvement;
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

export function ImprovementCard({ improvement, className }: ImprovementCardProps) {
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
    <div className={cn('rounded-xl border border-card-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-background/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent">{meta.icon}</span>
            <Badge variant={severityVariant(improvement.severity)} size="sm">
              {improvement.severity}
            </Badge>
            <Badge variant="neutral" size="sm">{meta.label}</Badge>
            {improvement.category && (
              <span className="text-[10px] text-muted">{improvement.category}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {improvement.effort && (
              <span className="text-[10px] text-muted bg-background/50 px-2 py-0.5 rounded">
                {improvement.effort}
              </span>
            )}
            <span className="text-muted text-xs">{expanded ? '-' : '+'}</span>
          </div>
        </div>

        <p className="mt-2 text-sm text-foreground">{improvement.suggestion}</p>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-card-border px-4 pb-4">
          <div className="mt-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">Problem</p>
            <p className="text-sm text-foreground/80">{improvement.problem}</p>
          </div>

          {improvement.config && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                  Configuration
                </p>
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="text-[10px] text-accent hover:text-accent-hover transition-colors"
                >
                  {copiedConfig ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="rounded-lg bg-background/50 p-3 text-[11px] text-foreground/70 font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(improvement.config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
