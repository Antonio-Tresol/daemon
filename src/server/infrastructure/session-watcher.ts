import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';

export type SessionFileEvent = {
  sessionId: string;
  filePath: string;
  lines: Record<string, unknown>[];
};

type WatcherCallback = (event: SessionFileEvent) => void;

const fileOffsets = new Map<string, number>();
let watcher: fs.FSWatcher | null = null;
const callbacks: WatcherCallback[] = [];

function getClaudeProjectsDir(): string {
  return path.join(os.homedir(), '.claude', 'projects');
}

async function readNewLines(
  filePath: string,
): Promise<Record<string, unknown>[]> {
  const currentOffset = fileOffsets.get(filePath) ?? 0;

  const stat = fs.statSync(filePath);
  if (stat.size <= currentOffset) {
    return [];
  }

  const stream = fs.createReadStream(filePath, {
    start: currentOffset,
    encoding: 'utf-8',
  });

  const rl = readline.createInterface({ input: stream, crlfDelay: Number.POSITIVE_INFINITY });
  const lines: Record<string, unknown>[] = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      lines.push(JSON.parse(trimmed) as Record<string, unknown>);
    } catch {
      // skip malformed lines
    }
  }

  fileOffsets.set(filePath, stat.size);
  return lines;
}

function extractSessionId(filePath: string): string {
  const basename = path.basename(filePath, '.jsonl');
  return basename;
}

async function handleFileChange(filePath: string): Promise<void> {
  if (!filePath.endsWith('.jsonl')) return;

  const lines = await readNewLines(filePath);
  if (lines.length === 0) return;

  const sessionId = extractSessionId(filePath);
  const event: SessionFileEvent = { sessionId, filePath, lines };

  for (const cb of callbacks) {
    try {
      cb(event);
    } catch {
      // prevent one callback failure from blocking others
    }
  }
}

export function startWatching(onEvent: WatcherCallback): void {
  callbacks.push(onEvent);

  if (watcher) return;

  const projectsDir = getClaudeProjectsDir();

  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
  }

  watcher = fs.watch(
    projectsDir,
    { recursive: true },
    (_eventType, filename) => {
      if (!filename) return;
      const fullPath = path.join(projectsDir, filename);

      if (!fs.existsSync(fullPath)) return;
      if (!fullPath.endsWith('.jsonl')) return;

      void handleFileChange(fullPath);
    },
  );
}

export function stopWatching(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  callbacks.length = 0;
  fileOffsets.clear();
}
