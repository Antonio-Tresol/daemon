import type { AnalysisType, AnalysisResult } from '../analysis/analysis.entity';

export interface SendMessageResult {
  success: boolean;
  response: string;
  error: string | null;
}

export interface ClaudeRunnerPort {
  sendMessage(sessionId: string, message: string): Promise<SendMessageResult>;
  runAnalysis(
    type: AnalysisType,
    sessionData: string,
  ): Promise<AnalysisResult['result']>;
}
