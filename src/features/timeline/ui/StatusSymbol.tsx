type StatusSymbolProps = {
  status: string;
};

export function StatusSymbol({ status }: StatusSymbolProps) {
  switch (status) {
    case 'completed':
      return <span className="text-[10px] font-mono text-text-secondary">{'\u2713'}</span>;
    case 'failed':
      return <span className="text-[10px] font-mono text-text-primary">{'\u2717'}</span>;
    case 'in_progress':
      return <span className="text-[10px] font-mono text-ember animate-pulse">{'\u25CF'}</span>;
    default:
      return <span className="text-[10px] font-mono text-text-muted">{'\u25CC'}</span>;
  }
}
