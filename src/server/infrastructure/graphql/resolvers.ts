import type {
  AnalysisResult,
  Failure,
  Improvement,
  TimelinePlan,
} from '../../domain/analysis/analysis.entity';
import { SqliteAnalysisRepository } from '../db/analysis.sqlite-repo';
import { SqliteEventRepository } from '../db/event.sqlite-repo';
import { SqliteSessionRepository } from '../db/session.sqlite-repo';

function getFailuresFromAnalysis(sessionId: string): Failure[] {
  const analysisRepo = new SqliteAnalysisRepository();
  const row = analysisRepo.findLatestByType(sessionId, 'failures');
  if (!row || row.status !== 'completed' || !row.result) return [];
  return (row.result.failures ?? []) satisfies Failure[];
}

function getImprovementsFromAnalysis(sessionId: string): Improvement[] {
  const analysisRepo = new SqliteAnalysisRepository();
  const row = analysisRepo.findLatestByType(sessionId, 'improvements');
  if (!row || row.status !== 'completed' || !row.result) return [];
  return (row.result.improvements ?? []) satisfies Improvement[];
}

function getTimelinePlansFromAnalysis(sessionId: string): TimelinePlan[] {
  const analysisRepo = new SqliteAnalysisRepository();
  const row = analysisRepo.findLatestByType(sessionId, 'timeline');
  if (!row || row.status !== 'completed' || !row.result) return [];
  return (row.result.plans ?? []) satisfies TimelinePlan[];
}

export const resolvers = {
  Query: {
    sessions: (_parent: unknown, args: { status?: string; limit?: number }) => {
      const sessionRepo = new SqliteSessionRepository();
      const limit = Math.min(args.limit ?? 50, 200);

      let sessions = args.status === 'active' ? sessionRepo.findActive() : sessionRepo.findAll();

      if (args.status && args.status !== 'active') {
        sessions = sessions.filter((s) => s.status === args.status);
      }

      return sessions.slice(0, limit);
    },

    session: (_parent: unknown, args: { id: string }) => {
      const sessionRepo = new SqliteSessionRepository();
      return sessionRepo.findById(args.id);
    },

    timeline: (_parent: unknown, args: { sessionId: string }) => {
      return { sessionId: args.sessionId };
    },

    failures: (_parent: unknown, args: { sessionId: string; impact?: string; type?: string }) => {
      let failures = getFailuresFromAnalysis(args.sessionId);
      if (args.impact) {
        const impactLower = args.impact.toLowerCase();
        failures = failures.filter((f) => f.impact.toLowerCase() === impactLower);
      }
      if (args.type) {
        failures = failures.filter((f) => f.type === args.type);
      }
      return failures;
    },

    improvements: (
      _parent: unknown,
      args: {
        sessionId: string;
        area?: string;
        severity?: string;
      },
    ) => {
      let improvements = getImprovementsFromAnalysis(args.sessionId);
      if (args.area) {
        const areaLower = args.area.toLowerCase();
        improvements = improvements.filter((i) => i.area.toLowerCase() === areaLower);
      }
      if (args.severity) {
        const sevLower = args.severity.toLowerCase();
        improvements = improvements.filter((i) => i.severity.toLowerCase() === sevLower);
      }
      return improvements.map((i) => ({
        ...i,
        config: i.config ? JSON.stringify(i.config) : null,
      }));
    },

    events: (_parent: unknown, args: { sessionId: string; type?: string; toolName?: string }) => {
      const eventRepo = new SqliteEventRepository();
      return eventRepo.findPaginated({
        sessionId: args.sessionId,
        eventType: args.type,
        toolName: args.toolName,
      });
    },

    groups: () => {
      const sessionRepo = new SqliteSessionRepository();
      return sessionRepo.findGroups();
    },

    failureSummary: (_parent: unknown, args: { sessionId: string }) => {
      const failures = getFailuresFromAnalysis(args.sessionId);
      const byTypeMap = new Map<string, number>();
      const byImpactMap = new Map<string, number>();

      for (const f of failures) {
        byTypeMap.set(f.type, (byTypeMap.get(f.type) ?? 0) + 1);
        byImpactMap.set(f.impact, (byImpactMap.get(f.impact) ?? 0) + 1);
      }

      return {
        byType: Array.from(byTypeMap.entries()).map(([type, count]) => ({
          type,
          count,
        })),
        byImpact: Array.from(byImpactMap.entries()).map(([impact, count]) => ({ impact, count })),
        total: failures.length,
      };
    },
  },

  Mutation: {
    updateSession: (_parent: unknown, args: { id: string; name?: string; groupLabel?: string }) => {
      const sessionRepo = new SqliteSessionRepository();

      const existing = sessionRepo.findById(args.id);
      if (!existing) return null;

      if (args.name !== undefined) {
        sessionRepo.updateName(args.id, args.name);
      }
      if (args.groupLabel !== undefined) {
        sessionRepo.updateGroup(args.id, args.groupLabel);
      }

      return sessionRepo.findById(args.id);
    },

    analyze: (_parent: unknown, args: { sessionId: string; type: string; level?: number }) => {
      const analysisRepo = new SqliteAnalysisRepository();
      const analysisId = crypto.randomUUID();
      const triggeredAt = new Date().toISOString();
      const analysisType = args.type.toLowerCase();
      const level = args.level ?? 0;

      analysisRepo.save({
        id: analysisId,
        sessionId: args.sessionId,
        analysisType: analysisType as AnalysisResult['analysisType'],
        level,
        triggeredAt,
        completedAt: null,
        status: 'pending',
        result: null,
        error: null,
      });

      return {
        id: analysisId,
        sessionId: args.sessionId,
        analysisType,
        status: 'pending',
        level,
        triggeredAt,
        completedAt: null,
        error: null,
      };
    },
  },

  Timeline: {
    plans: (parent: { sessionId: string }, _args: { level?: number }) => {
      return getTimelinePlansFromAnalysis(parent.sessionId);
    },
  },
};
