import { type NextRequest, NextResponse } from 'next/server';
import { SqliteAnalysisRepository } from '@/server/infrastructure/db/analysis.sqlite-repo';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const analysisRepo = new SqliteAnalysisRepository();

    const analysis = analysisRepo.findById(id);

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
