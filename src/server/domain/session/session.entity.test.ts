import { describe, it, expect } from 'vitest';
import { Session } from './session.entity';
import { HookEvent } from '../event/event.entity';

function makeEvent(overrides: {
  timestamp?: string;
  eventType?: string;
  costUsd?: number;
} = {}): HookEvent {
  const payload = overrides.costUsd !== undefined ? { cost_usd: overrides.costUsd } : {};
  return new HookEvent(
    'evt-1',
    'sess-1',
    overrides.timestamp ?? '2025-01-01T01:00:00Z',
    (overrides.eventType ?? 'PreToolUse') as HookEvent['eventType'],
    null,
    null,
    null,
    null,
    payload,
  );
}

describe('Session', () => {
  describe('Session.create', () => {
    it('creates a new active session with initial values', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', '/home/user');

      expect(session.id).toBe('sess-1');
      expect(session.startTime).toBe('2025-01-01T00:00:00Z');
      expect(session.endTime).toBeNull();
      expect(session.status).toBe('active');
      expect(session.cwd).toBe('/home/user');
      expect(session.projectHash).toBeNull();
      expect(session.totalEvents).toBe(1);
      expect(session.totalCostUsd).toBe(0);
      expect(session.name).toBeNull();
      expect(session.groupLabel).toBeNull();
    });

    it('creates session with null cwd', () => {
      const session = Session.create('sess-2', '2025-01-01T00:00:00Z', null);
      expect(session.cwd).toBeNull();
    });
  });

  describe('ingestEvent', () => {
    it('updates totalEvents and accumulates cost', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', null);
      const event = makeEvent({ costUsd: 0.05 });

      session.ingestEvent(event, 5);

      expect(session.totalEvents).toBe(5);
      expect(session.totalCostUsd).toBeCloseTo(0.05);
    });

    it('accumulates cost across multiple events', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', null);

      session.ingestEvent(makeEvent({ costUsd: 0.10 }), 2);
      session.ingestEvent(makeEvent({ costUsd: 0.20 }), 3);

      expect(session.totalCostUsd).toBeCloseTo(0.30);
      expect(session.totalEvents).toBe(3);
    });

    it('marks session as completed on SessionEnd event', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', null);
      const endEvent = makeEvent({
        eventType: 'SessionEnd',
        timestamp: '2025-01-01T02:00:00Z',
      });

      session.ingestEvent(endEvent, 10);

      expect(session.status).toBe('completed');
      expect(session.endTime).toBe('2025-01-01T02:00:00Z');
    });

    it('marks session as completed on Stop event', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', null);
      const stopEvent = makeEvent({
        eventType: 'Stop',
        timestamp: '2025-01-01T03:00:00Z',
      });

      session.ingestEvent(stopEvent, 5);

      expect(session.status).toBe('completed');
      expect(session.endTime).toBe('2025-01-01T03:00:00Z');
    });

    it('marks session as error on api_error event', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', null);
      const errorEvent = makeEvent({ eventType: 'api_error' });

      session.ingestEvent(errorEvent, 2);

      expect(session.status).toBe('error');
    });

    it('does not change status for regular events', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', null);
      const regularEvent = makeEvent({ eventType: 'PreToolUse' });

      session.ingestEvent(regularEvent, 2);

      expect(session.status).toBe('active');
    });
  });

  describe('setCwd', () => {
    it('sets cwd when not already set', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', null);
      expect(session.cwd).toBeNull();

      session.setCwd('/new/path');
      expect(session.cwd).toBe('/new/path');
    });

    it('does not overwrite existing cwd', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', '/original');

      session.setCwd('/new/path');
      expect(session.cwd).toBe('/original');
    });
  });

  describe('completeSession', () => {
    it('sets endTime and status to completed', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', null);

      session.completeSession('2025-01-01T05:00:00Z');

      expect(session.endTime).toBe('2025-01-01T05:00:00Z');
      expect(session.status).toBe('completed');
    });
  });

  describe('markSessionError', () => {
    it('sets status to error', () => {
      const session = Session.create('sess-1', '2025-01-01T00:00:00Z', null);

      session.markSessionError();

      expect(session.status).toBe('error');
    });
  });
});
