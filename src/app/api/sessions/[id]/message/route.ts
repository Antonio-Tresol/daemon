import { type NextRequest, NextResponse } from 'next/server';
import { SendMessageUseCase } from '@/server/application/send-message.use-case';
import { createClaudeRunner } from '@/server/infrastructure/create-claude-runner';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const claudeRunner = createClaudeRunner();
    const useCase = new SendMessageUseCase(claudeRunner);
    const result = await useCase.execute(sessionId, message);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      response: result.response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
