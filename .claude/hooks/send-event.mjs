#!/usr/bin/env node
/**
 * Event ingestion hook: sends hook data to daemon server.
 * Fails silently if daemon isn't running — no error, no noise.
 */
import { request } from 'node:http';

const DAEMON_URL = process.env.DAEMON_URL || 'http://localhost:3000/api/events';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  if (!input) {
    process.exit(0);
  }

  const url = new URL(DAEMON_URL);
  const req = request(
    {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    },
    (res) => {
      // Drain response
      res.resume();
      process.exit(0);
    },
  );

  req.on('error', () => {
    // Daemon not running — that's fine, fail silently
    process.exit(0);
  });

  req.on('timeout', () => {
    req.destroy();
    process.exit(0);
  });

  req.write(input);
  req.end();
});
