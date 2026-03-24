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

/**
 * Raw session shape from the API (snake_case DB columns).
 */
export type RawSession = {
  id: string;
  start_time: string;
  end_time: string | null;
  status: SessionStatus;
  cwd: string | null;
  project_hash: string | null;
  total_events: number;
  total_cost_usd: number;
  name: string | null;
  group_label: string | null;
};

export function normalizeSession(raw: RawSession): Session {
  return {
    id: raw.id,
    startTime: raw.start_time,
    endTime: raw.end_time,
    status: raw.status,
    cwd: raw.cwd,
    projectHash: raw.project_hash,
    totalEvents: raw.total_events ?? 0,
    totalCostUsd: raw.total_cost_usd ?? 0,
    name: raw.name ?? null,
    groupLabel: raw.group_label ?? null,
  };
}
