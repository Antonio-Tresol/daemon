import type Database from 'better-sqlite3';

/** After a Level 0 timeline analysis, auto-name the session with the first plan name if unnamed */
export function autoNameSession(
  db: Database.Database,
  sessionId: string,
  result: unknown,
): void {
  try {
    const session = db.prepare('SELECT name FROM sessions WHERE id = ?').get(sessionId) as { name: string | null } | undefined; // .get() returns unknown
    if (session?.name) return; // already named

    // Extract first plan name from timeline result
    const plans = (result as Record<string, unknown> | null)?.plans; // result is unknown, narrowing to access .plans
    if (!Array.isArray(plans) || plans.length === 0) return;

    const firstPlan = plans[0] as Record<string, unknown>; // array element is unknown
    const planName = typeof firstPlan.name === 'string' ? firstPlan.name : null;
    if (!planName) return;

    db.prepare('UPDATE sessions SET name = ? WHERE id = ?').run(planName, sessionId);
  } catch {
    // Non-critical — don't fail the analysis response
  }
}
