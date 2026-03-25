import { and, desc, eq } from 'drizzle-orm';
import type { AnalysisResult, AnalysisType } from '../../domain/analysis/analysis.entity';
import type { AnalysisRepository } from '../../domain/analysis/analysis.repository';
import { analyses } from './drizzle-schema';
import { getDb } from './sqlite';

export class SqliteAnalysisRepository implements AnalysisRepository {
  save(analysis: AnalysisResult): void {
    const db = getDb();
    db.insert(analyses)
      .values({
        id: analysis.id,
        sessionId: analysis.sessionId,
        analysisType: analysis.analysisType,
        level: analysis.level,
        triggeredAt: analysis.triggeredAt,
        completedAt: analysis.completedAt ?? null,
        status: analysis.status,
        result: analysis.result ?? null,
        error: analysis.error ?? null,
      })
      .onConflictDoUpdate({
        target: analyses.id,
        set: {
          sessionId: analysis.sessionId,
          analysisType: analysis.analysisType,
          level: analysis.level,
          triggeredAt: analysis.triggeredAt,
          completedAt: analysis.completedAt ?? null,
          status: analysis.status,
          result: analysis.result ?? null,
          error: analysis.error ?? null,
        },
      })
      .run();
  }

  update(analysis: AnalysisResult): void {
    const db = getDb();
    db.update(analyses)
      .set({
        completedAt: analysis.completedAt ?? null,
        status: analysis.status,
        result: analysis.result ?? null,
        error: analysis.error ?? null,
      })
      .where(eq(analyses.id, analysis.id))
      .run();
  }

  findById(id: string): AnalysisResult | null {
    const db = getDb();
    const row = db.select().from(analyses).where(eq(analyses.id, id)).get();
    if (!row) return null;
    return {
      ...row,
      analysisType: row.analysisType as AnalysisType,
      status: row.status as AnalysisResult['status'],
      result: row.result as AnalysisResult['result'] | null,
    };
  }

  findBySessionId(sessionId: string, level?: number): AnalysisResult[] {
    const db = getDb();
    const query = db.select().from(analyses);
    const filters =
      level !== undefined
        ? and(eq(analyses.sessionId, sessionId), eq(analyses.level, level))
        : eq(analyses.sessionId, sessionId);

    const rows = query.where(filters).orderBy(desc(analyses.triggeredAt)).all();
    return rows.map((row) => ({
      ...row,
      analysisType: row.analysisType as AnalysisType,
      status: row.status as AnalysisResult['status'],
      result: row.result as AnalysisResult['result'] | null,
    }));
  }

  findLatestByType(
    sessionId: string,
    analysisType: AnalysisType,
    level?: number,
  ): AnalysisResult | null {
    const db = getDb();
    const query = db.select().from(analyses);
    const filters =
      level !== undefined
        ? and(
            eq(analyses.sessionId, sessionId),
            eq(analyses.analysisType, analysisType),
            eq(analyses.level, level),
          )
        : and(eq(analyses.sessionId, sessionId), eq(analyses.analysisType, analysisType));

    const row = query.where(filters).orderBy(desc(analyses.triggeredAt)).get();
    if (!row) return null;
    return {
      ...row,
      analysisType: row.analysisType as AnalysisType,
      status: row.status as AnalysisResult['status'],
      result: row.result as AnalysisResult['result'] | null,
    };
  }

  findBySessionIdAndLevel(
    sessionId: string,
    analysisType: AnalysisType,
    level: number,
  ): AnalysisResult | null {
    const db = getDb();
    const row = db
      .select()
      .from(analyses)
      .where(
        and(
          eq(analyses.sessionId, sessionId),
          eq(analyses.analysisType, analysisType),
          eq(analyses.level, level),
          eq(analyses.status, 'completed'),
        ),
      )
      .orderBy(desc(analyses.triggeredAt))
      .get();

    if (!row) return null;
    return {
      ...row,
      analysisType: row.analysisType as AnalysisType,
      status: row.status as AnalysisResult['status'],
      result: row.result as AnalysisResult['result'] | null,
    };
  }

  findPaginated({
    sessionId,
    analysisType,
    level,
    limit = 20,
    offset = 0,
  }: {
    sessionId?: string | null;
    analysisType?: string | null;
    level?: number;
    limit?: number;
    offset?: number;
  }): AnalysisResult[] {
    const db = getDb();
    let query = db.select().from(analyses);
    const conditions = [];
    if (sessionId) conditions.push(eq(analyses.sessionId, sessionId));
    if (analysisType) conditions.push(eq(analyses.analysisType, analysisType));
    if (level !== undefined) conditions.push(eq(analyses.level, level));

    if (conditions.length > 0) {
      // Drizzle's .where() narrows the query type, but reassignment requires widening — safe because we only add valid conditions
      query = query.where(and(...conditions)) as typeof query;
    }

    const rows = query.orderBy(desc(analyses.triggeredAt)).limit(limit).offset(offset).all();
    return rows.map((row) => ({
      ...row,
      analysisType: row.analysisType as AnalysisType,
      status: row.status as AnalysisResult['status'],
      result: row.result as AnalysisResult['result'] | null,
    }));
  }
}
