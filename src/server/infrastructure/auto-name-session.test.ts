import { Session } from '../domain/session/session.entity';
import type { SessionRepository } from '../domain/session/session.repository';
import { autoNameSession } from './auto-name-session';

function createMockRepo(session: Session | null, shouldThrow = false) {
  const updateNameFn = vi.fn();
  const repo: SessionRepository = {
    findById: () => {
      if (shouldThrow) throw new Error('DB error');
      return session;
    },
    updateName: updateNameFn,
    save: vi.fn(),
    update: vi.fn(),
    findAll: () => [],
    findActive: () => [],
    updateGroup: vi.fn(),
    findByGroup: () => [],
    findGroups: () => [],
  };
  return { repo, updateNameFn };
}

function makeSession(name: string | null): Session {
  return new Session(
    'session-1',
    '2026-03-25T10:00:00.000Z',
    null,
    'active',
    null,
    null,
    1,
    0,
    name,
    null,
  );
}

describe('autoNameSession', () => {
  it('does not update if session already has a name', () => {
    const { repo, updateNameFn } = createMockRepo(makeSession('Existing Name'));
    autoNameSession(repo, 'session-1', { plans: [{ name: 'New Plan' }] });
    expect(updateNameFn).not.toHaveBeenCalled();
  });

  it('does not update if result has no plans', () => {
    const { repo, updateNameFn } = createMockRepo(makeSession(null));
    autoNameSession(repo, 'session-1', { plans: [] });
    expect(updateNameFn).not.toHaveBeenCalled();
  });

  it('does not update if result is null', () => {
    const { repo, updateNameFn } = createMockRepo(makeSession(null));
    autoNameSession(repo, 'session-1', null);
    expect(updateNameFn).not.toHaveBeenCalled();
  });

  it('does not update if plans is not an array', () => {
    const { repo, updateNameFn } = createMockRepo(makeSession(null));
    autoNameSession(repo, 'session-1', { plans: 'not-array' });
    expect(updateNameFn).not.toHaveBeenCalled();
  });

  it('names session from first plan', () => {
    const { repo, updateNameFn } = createMockRepo(makeSession(null));
    autoNameSession(repo, 'session-1', {
      plans: [{ name: 'Build auth module' }, { name: 'Second plan' }],
    });
    expect(updateNameFn).toHaveBeenCalledWith('session-1', 'Build auth module');
  });

  it('does not update if first plan has no name', () => {
    const { repo, updateNameFn } = createMockRepo(makeSession(null));
    autoNameSession(repo, 'session-1', { plans: [{ title: 'no name field' }] });
    expect(updateNameFn).not.toHaveBeenCalled();
  });

  it('does not update if session not found', () => {
    const { repo, updateNameFn } = createMockRepo(null);
    autoNameSession(repo, 'session-1', { plans: [{ name: 'Plan' }] });
    expect(updateNameFn).not.toHaveBeenCalled();
  });

  it('handles error silently', () => {
    const { repo } = createMockRepo(null, true);
    expect(() => autoNameSession(repo, 'session-1', { plans: [{ name: 'Plan' }] })).not.toThrow();
  });
});
