import type { SessionRepository } from '../domain/session/session.repository';

/** After a Level 0 timeline analysis, auto-name the session with the first plan name if unnamed */
export function autoNameSession(
  sessionRepo: SessionRepository,
  sessionId: string,
  result: unknown,
): void {
  try {
    const session = sessionRepo.findById(sessionId);
    if (!session || session.name) return; // not found or already named

    // Extract first plan name from timeline result
    const plans = (result as Record<string, unknown> | null)?.plans; // result is unknown, narrowing to access .plans
    if (!Array.isArray(plans) || plans.length === 0) return;

    const firstPlan = plans[0] as Record<string, unknown>; // array element is unknown
    const planName = typeof firstPlan.name === 'string' ? firstPlan.name : null;
    if (!planName) return;

    sessionRepo.updateName(sessionId, planName);
  } catch {
    // Non-critical — don't fail the analysis response
  }
}
