import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import {
  CREATE_EVENTS_TABLE,
  CREATE_SESSIONS_TABLE,
  CREATE_ANALYSES_TABLE,
  CREATE_OTEL_METRICS_TABLE,
  CREATE_INDEXES,
} from './schema';

let instance: Database.Database | null = null;

function getDbPath(): string {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'command-center.db');
}

function initializeTables(db: Database.Database): void {
  db.exec(CREATE_SESSIONS_TABLE);
  db.exec(CREATE_EVENTS_TABLE);
  db.exec(CREATE_ANALYSES_TABLE);
  db.exec(CREATE_OTEL_METRICS_TABLE);

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

export function closeDatabase(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
