import type { Session } from './session.entity';

export interface SessionRepository {
  save(session: Session): void;
  update(session: Session): void;
  findById(id: string): Session | null;
  findAll(): Session[];
  findActive(): Session[];
}
