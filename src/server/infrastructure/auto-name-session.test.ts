import { autoNameSession } from './auto-name-session';

function createMockDb(sessionName: string | null, shouldThrow = false) {
  const runFn = vi.fn();
  const db = {
    prepare: vi.fn((sql: string) => {
      if (shouldThrow) throw new Error('DB error');
      if (sql.startsWith('SELECT')) {
        return {
          get: () => (sessionName !== undefined ? { name: sessionName } : undefined),
        };
      }
      return { run: runFn };
    }),
  } as unknown as Parameters<typeof autoNameSession>[0];
  return { db, runFn };
}

describe('autoNameSession', () => {
  it('does not update if session already has a name', () => {
    const { db, runFn } = createMockDb('Existing Name');
    autoNameSession(db, 'session-1', { plans: [{ name: 'New Plan' }] });
    expect(runFn).not.toHaveBeenCalled();
  });

  it('does not update if result has no plans', () => {
    const { db, runFn } = createMockDb(null);
    autoNameSession(db, 'session-1', { plans: [] });
    expect(runFn).not.toHaveBeenCalled();
  });

  it('does not update if result is null', () => {
    const { db, runFn } = createMockDb(null);
    autoNameSession(db, 'session-1', null);
    expect(runFn).not.toHaveBeenCalled();
  });

  it('does not update if plans is not an array', () => {
    const { db, runFn } = createMockDb(null);
    autoNameSession(db, 'session-1', { plans: 'not-array' });
    expect(runFn).not.toHaveBeenCalled();
  });

  it('names session from first plan', () => {
    const { db, runFn } = createMockDb(null);
    autoNameSession(db, 'session-1', {
      plans: [{ name: 'Build auth module' }, { name: 'Second plan' }],
    });
    expect(runFn).toHaveBeenCalledWith('Build auth module', 'session-1');
  });

  it('does not update if first plan has no name', () => {
    const { db, runFn } = createMockDb(null);
    autoNameSession(db, 'session-1', { plans: [{ title: 'no name field' }] });
    expect(runFn).not.toHaveBeenCalled();
  });

  it('handles DB error silently', () => {
    const { db } = createMockDb(null, true);
    expect(() => autoNameSession(db, 'session-1', { plans: [{ name: 'Plan' }] })).not.toThrow();
  });
});
