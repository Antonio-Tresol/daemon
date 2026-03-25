import { formatCost, formatDuration, formatTimestamp } from './format';

describe('formatTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns seconds ago for recent timestamps', () => {
    const iso = new Date(Date.now() - 30_000).toISOString();
    expect(formatTimestamp(iso)).toBe('30s ago');
  });

  it('returns minutes ago', () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatTimestamp(iso)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const iso = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatTimestamp(iso)).toBe('3h ago');
  });

  it('returns days ago for less than a week', () => {
    const iso = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(formatTimestamp(iso)).toBe('2d ago');
  });

  it('returns formatted date for older timestamps', () => {
    const iso = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const result = formatTimestamp(iso);
    expect(result).toMatch(/Mar \d+/);
  });

  it('returns "just now" for future timestamps', () => {
    const iso = new Date(Date.now() + 60_000).toISOString();
    expect(formatTimestamp(iso)).toBe('just now');
  });

  it('handles zero diff (exact now)', () => {
    const iso = new Date(Date.now()).toISOString();
    expect(formatTimestamp(iso)).toBe('0s ago');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('formats zero ms', () => {
    expect(formatDuration(0)).toBe('0ms');
  });

  it('formats seconds with one decimal', () => {
    expect(formatDuration(1500)).toBe('1.5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125_000)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3_725_000)).toBe('1h 2m');
  });

  it('rounds milliseconds', () => {
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats exactly one second', () => {
    expect(formatDuration(1000)).toBe('1.0s');
  });
});

describe('formatCost', () => {
  it('formats zero', () => {
    expect(formatCost(0)).toBe('$0.00');
  });

  it('formats tiny amounts with 4 decimals', () => {
    expect(formatCost(0.0012)).toBe('$0.0012');
  });

  it('formats sub-dollar amounts with 3 decimals', () => {
    expect(formatCost(0.123)).toBe('$0.123');
  });

  it('formats dollar amounts with 2 decimals', () => {
    expect(formatCost(5.5)).toBe('$5.50');
  });

  it('formats exact penny boundary', () => {
    expect(formatCost(0.01)).toBe('$0.010');
  });

  it('formats exactly one dollar', () => {
    expect(formatCost(1)).toBe('$1.00');
  });
});
