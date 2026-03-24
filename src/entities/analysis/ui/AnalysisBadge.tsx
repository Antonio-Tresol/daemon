import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';

type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

type AnalysisBadgeProps = {
  status: AnalysisStatus;
  className?: string;
};

function statusVariant(status: AnalysisStatus) {
  switch (status) {
    case 'pending': return 'neutral' as const;
    case 'running': return 'info' as const;
    case 'completed': return 'success' as const;
    case 'failed': return 'error' as const;
  }
}

export function AnalysisBadge({ status, className }: AnalysisBadgeProps) {
  return (
    <Badge variant={statusVariant(status)} size="sm" className={cn(className)}>
      {status}
    </Badge>
  );
}
