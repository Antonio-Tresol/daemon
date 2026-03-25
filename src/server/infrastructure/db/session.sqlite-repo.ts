import { desc, eq, isNotNull } from 'drizzle-orm';
import { Session } from '../../domain/session/session.entity';
import type { SessionRepository } from '../../domain/session/session.repository';
import { sessions } from './drizzle-schema';
import { getDb } from './sqlite';

export class SqliteSessionRepository implements SessionRepository {
  private mapToDomain(row: typeof sessions.$inferSelect): Session {
    return new Session(
      row.id,
      row.startTime,
      row.endTime,
      row.status as Session['status'],
      row.cwd,
      row.projectHash,
      row.totalEvents,
      row.totalCostUsd,
      row.name,
      row.groupLabel,
    );
  }

  save(session: Session): void {
    const db = getDb();
    db.insert(sessions)
      .values({
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime ?? null,
        status: session.status,
        cwd: session.cwd ?? null,
        projectHash: session.projectHash ?? null,
        totalEvents: session.totalEvents,
        totalCostUsd: session.totalCostUsd,
        name: session.name ?? null,
        groupLabel: session.groupLabel ?? null,
      })
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          startTime: session.startTime,
          endTime: session.endTime ?? null,
          status: session.status,
          cwd: session.cwd ?? null,
          projectHash: session.projectHash ?? null,
          totalEvents: session.totalEvents,
          totalCostUsd: session.totalCostUsd,
          name: session.name ?? null,
          groupLabel: session.groupLabel ?? null,
        },
      })
      .run();
  }

  update(session: Session): void {
    const db = getDb();
    db.update(sessions)
      .set({
        startTime: session.startTime,
        endTime: session.endTime ?? null,
        status: session.status,
        cwd: session.cwd ?? null,
        projectHash: session.projectHash ?? null,
        totalEvents: session.totalEvents,
        totalCostUsd: session.totalCostUsd,
        name: session.name ?? null,
        groupLabel: session.groupLabel ?? null,
      })
      .where(eq(sessions.id, session.id))
      .run();
  }

  findById(id: string): Session | null {
    const db = getDb();
    const row = db.select().from(sessions).where(eq(sessions.id, id)).get();
    if (!row) return null;
    return this.mapToDomain(row);
  }

  findAll(): Session[] {
    const db = getDb();
    const rows = db.select().from(sessions).orderBy(desc(sessions.startTime)).all();
    return rows.map((row) => this.mapToDomain(row));
  }

  findActive(): Session[] {
    const db = getDb();
    const rows = db
      .select()
      .from(sessions)
      .where(eq(sessions.status, 'active'))
      .orderBy(desc(sessions.startTime))
      .all();
    return rows.map((row) => this.mapToDomain(row));
  }

  updateName(id: string, name: string): void {
    const db = getDb();
    db.update(sessions).set({ name }).where(eq(sessions.id, id)).run();
  }

  updateGroup(id: string, groupLabel: string | null): void {
    const db = getDb();
    db.update(sessions).set({ groupLabel }).where(eq(sessions.id, id)).run();
  }

  findByGroup(groupLabel: string): Session[] {
    const db = getDb();
    const rows = db
      .select()
      .from(sessions)
      .where(eq(sessions.groupLabel, groupLabel))
      .orderBy(desc(sessions.startTime))
      .all();
    return rows.map((row) => this.mapToDomain(row));
  }

  findGroups(): string[] {
    const db = getDb();
    const rows = db
      .select({ groupLabel: sessions.groupLabel })
      .from(sessions)
      .where(isNotNull(sessions.groupLabel))
      .all();
    return Array.from(new Set(rows.map((r) => r.groupLabel as string))).sort();
  }
}
