import type { Session } from './session.entity';

export interface SessionRepository {
  save(session: Session): void;
  update(session: Session): void;
  findById(id: string): Session | null;
  findAll(): Session[];
  findActive(): Session[];
  updateName(id: string, name: string): void;
  updateGroup(id: string, groupLabel: string | null): void;
  findByGroup(groupLabel: string): Session[];
  findGroups(): string[];
}
