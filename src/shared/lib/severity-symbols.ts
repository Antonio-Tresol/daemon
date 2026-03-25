/** Symbol for failure impact level: critical, warning, info */
export function impactSymbol(impact: string): string {
  switch (impact) {
    case 'critical': return '\u2717\u2717';
    case 'warning': return '\u25C6';
    case 'info': return '\u25CB';
    default: return '\u25CB';
  }
}

/** Symbol for improvement severity level: high, medium, low */
export function severitySymbol(severity: string): string {
  switch (severity) {
    case 'high': return '\u2717\u2717';
    case 'medium': return '\u25C6';
    case 'low': return '\u25CB';
    default: return '\u25CB';
  }
}
