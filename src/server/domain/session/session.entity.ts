export type SessionStatus = 'active' | 'completed' | 'error';

export type Session = {
  id: string;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  cwd: string | null;
  projectHash: string | null;
  totalEvents: number;
  totalCostUsd: number;
  name: string | null;
  groupLabel: string | null;
};
