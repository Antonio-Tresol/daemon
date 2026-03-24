'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import type { Improvement } from '@/entities/analysis/model';

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

function areaLabel(area: Improvement['area']): string {
  switch (area) {
    case 'hooks': return 'Hooks';
    case 'permissions': return 'Permissions';
    case 'workflow': return 'Workflow';
    case 'claude_md': return 'CLAUDE.md';
    case 'tooling': return 'Tooling';
  }
}

export function ImprovementCard({ improvement, className }: ImprovementCardProps) {
  const [copiedConfig, setCopiedConfig] = useState(false);

  function handleCopyConfig() {
    if (!improvement.hookConfig) return;
    navigator.clipboard
      .writeText(JSON.stringify(improvement.hookConfig, null, 2))
      .then(() => {
        setCopiedConfig(true);
        setTimeout(() => setCopiedConfig(false), 2000);
      })
      .catch(() => {
        // clipboard write failed silently
      });
  }

  return (
    <div className={cn('rounded-xl border border-card-border bg-card p-4', className)}>
      <div className="flex items-center gap-2">
        <Badge variant={severityVariant(improvement.severity)} size="sm">
          {improvement.severity}
        </Badge>
        <Badge variant="neutral" size="sm">{areaLabel(improvement.area)}</Badge>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">Problem</p>
        <p className="text-sm text-foreground">{improvement.problem}</p>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">Suggestion</p>
        <p className="text-sm text-foreground/80">{improvement.suggestion}</p>
      </div>

      {improvement.hookConfig && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Hook Config
            </p>
            <button
              type="button"
              onClick={handleCopyConfig}
              className="text-[10px] text-accent hover:text-accent-hover transition-colors"
            >
              {copiedConfig ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="rounded-lg bg-background/50 p-3 text-[11px] text-foreground/70 font-mono overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(improvement.hookConfig, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
