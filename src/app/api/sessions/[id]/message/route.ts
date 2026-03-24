import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: sessionId } = await params;
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { stdout, stderr } = await execFileAsync('claude', [
      '--resume', sessionId,
      '-p', message,
      '--output-format', 'json',
      '--bare',
    ], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120_000,
    });

    let response: unknown;
    try {
      response = JSON.parse(stdout);
    } catch {
      response = { rawOutput: stdout };
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      response,
      stderr: stderr || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
