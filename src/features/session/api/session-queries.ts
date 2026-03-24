import type { Session, RawSession } from '@/entities/session/model';
import { normalizeSession } from '@/entities/session/model';
import type { HookEvent } from '@/entities/event/model';

type SessionsResponse = {
  sessions: RawSession[];
};

type RawEvent = {
  id: string;
  session_id: string;
  timestamp: string;
  event_type: string;
  tool_name: string | null;
  success: boolean | null;
  duration_ms: number | null;
  prompt_id: string | null;
  payload: Record<string, unknown>;
};

type EventsResponse = {
  events: RawEvent[];
  count: number;
};

function normalizeEvent(raw: RawEvent): HookEvent {
  return {
    id: raw.id,
    sessionId: raw.session_id,
    timestamp: raw.timestamp,
    eventType: raw.event_type as HookEvent['eventType'],
    toolName: raw.tool_name,
    success: raw.success,
    durationMs: raw.duration_ms,
    promptId: raw.prompt_id,
    payload: raw.payload,
  };
}

export async function fetchSessions(status?: string): Promise<Session[]> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);

  const res = await fetch(`/api/sessions?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);

  const data = (await res.json()) as SessionsResponse;
  return (data.sessions ?? []).map(normalizeSession);
}

export async function fetchSessionEvents(
  sessionId: string,
  limit = 50,
): Promise<HookEvent[]> {
  const params = new URLSearchParams({
    sessionId,
    limit: String(limit),
  });

  const res = await fetch(`/api/events?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);

  const data = (await res.json()) as EventsResponse;
  return (data.events ?? []).map(normalizeEvent);
}

type SendMessageResponse = {
  ok: boolean;
  response?: string;
  error?: string;
};

export async function sendSessionMessage(
  sessionId: string,
  message: string,
): Promise<SendMessageResponse> {
  const res = await fetch(`/api/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);

  return (await res.json()) as SendMessageResponse;
}
