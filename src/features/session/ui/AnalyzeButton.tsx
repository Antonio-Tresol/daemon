'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { ANALYSIS_TYPES } from '@/entities/analysis/analysis-types';
import { AnalysisBadge } from '@/entities/analysis/ui/AnalysisBadge';

type AnalysisStatus = 'idle' | 'running' | 'completed' | 'failed';

type AnalyzeButtonProps = {
  sessionId: string;
  className?: string;
  onComplete?: () => void;
};

export function AnalyzeButton({ sessionId, className, onComplete }: AnalyzeButtonProps) {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [progress, setProgress] = useState<
    Record<string, 'pending' | 'running' | 'completed' | 'failed'>
  >({});

  const handleAnalyze = async () => {
    if (status === 'running') return;

    setStatus('running');
    setProgress(Object.fromEntries(ANALYSIS_TYPES.map((t) => [t, 'running' as const])));

    const results = await Promise.allSettled(
      ANALYSIS_TYPES.map(async (type) => {
        const res = await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, type, level: 0 }),
        });

        const data = (await res.json()) as { ok?: boolean }; // fetch .json() returns unknown

        setProgress((prev) => ({
          ...prev,
          [type]: data.ok ? 'completed' : 'failed',
        }));

        if (!res.ok || !data.ok) {
          throw new Error(`${type} analysis failed`);
        }

        return data;
      }),
    );

    const allOk = results.every((r) => r.status === 'fulfilled');
    setStatus(allOk ? 'completed' : 'failed');
    onComplete?.();
  };

  const completedCount = Object.values(progress).filter((s) => s === 'completed').length;
  const failedCount = Object.values(progress).filter((s) => s === 'failed').length;

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={status === 'running'}
        className={clsx(
          'flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-mono font-medium transition-all duration-300',
          status === 'idle' && 'border border-ember/40 text-ember hover:bg-ember/10',
          status === 'running' && 'border border-ember/60 bg-ember/10 text-ember cursor-wait',
          status === 'completed' &&
            'border border-green-500/40 text-green-400 hover:bg-green-500/10',
          status === 'failed' && 'border border-red-500/40 text-red-400 hover:bg-red-500/10',
        )}
      >
        {status === 'idle' && (
          <>
            <span className="text-sm leading-none">{'\u25B6'}</span>
            Analyze
          </>
        )}
        {status === 'running' && (
          <>
            <span className="animate-spin text-sm leading-none">{'\u25E0'}</span>
            Analyzing... {completedCount}/{ANALYSIS_TYPES.length}
          </>
        )}
        {status === 'completed' && (
          <>
            <span className="text-sm leading-none">{'\u2713'}</span>
            Done — Re-analyze
          </>
        )}
        {status === 'failed' && (
          <>
            <span className="text-sm leading-none">{'\u2717'}</span>
            {failedCount} failed — Retry
          </>
        )}
      </button>

      {/* Per-type status dots */}
      {status === 'running' && (
        <div className="flex items-center gap-1.5">
          {ANALYSIS_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-1">
              <span className="text-[10px] text-text-muted font-mono">
                {type.slice(0, 1).toUpperCase()}
              </span>
              <AnalysisBadge status={progress[type] ?? 'pending'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
