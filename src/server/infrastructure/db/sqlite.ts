import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import * as drizzleSchema from './drizzle-schema';
import {
  CREATE_ANALYSES_TABLE,
  CREATE_EVENTS_TABLE,
  CREATE_INDEXES,
  CREATE_OTEL_METRICS_TABLE,
  CREATE_SESSIONS_TABLE,
} from './schema';

let instance: Database.Database | null = null;
let drizzleInstance: BetterSQLite3Database<typeof drizzleSchema> | null = null;

function getDbPath(): string {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'daemon.db');
}

function migrateAnalysesAddLevel(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info('analyses')").all() as Array<{ name: string }>; // PRAGMA returns unknown[]
  const hasLevel = columns.some((col) => col.name === 'level');
  if (!hasLevel) {
    db.exec('ALTER TABLE analyses ADD COLUMN level INTEGER NOT NULL DEFAULT 0');
  }
}

function migrateSessionsAddNameAndGroup(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info('sessions')").all() as Array<{ name: string }>; // PRAGMA returns unknown[]
  if (!columns.some((col) => col.name === 'name')) {
    db.exec('ALTER TABLE sessions ADD COLUMN name TEXT');
  }
  if (!columns.some((col) => col.name === 'group_label')) {
    db.exec('ALTER TABLE sessions ADD COLUMN group_label TEXT');
  }
}

function initializeTables(db: Database.Database): void {
  db.exec(CREATE_SESSIONS_TABLE);
  db.exec(CREATE_EVENTS_TABLE);
  db.exec(CREATE_ANALYSES_TABLE);
  db.exec(CREATE_OTEL_METRICS_TABLE);

  // Run migrations for existing databases
  migrateAnalysesAddLevel(db);
  migrateSessionsAddNameAndGroup(db);

  for (const indexSql of CREATE_INDEXES) {
    db.exec(indexSql);
  }
}

export function getDatabase(): Database.Database {
  if (instance) {
    return instance;
  }

  const dbPath = getDbPath();
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeTables(db);

  instance = db;
  return db;
}

export function getDb() {
  if (drizzleInstance) {
    return drizzleInstance;
  }
  const db = getDatabase();
  drizzleInstance = drizzle(db, { schema: drizzleSchema });
  return drizzleInstance;
}

export function closeDatabase(): void {
  if (instance) {
    instance.close();
    instance = null;
    drizzleInstance = null;
  }
}
