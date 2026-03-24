'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { sendSessionMessage } from '@/features/session/api/session-queries';

type ConsoleMessage = {
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: string;
};

type SessionConsoleProps = {
  sessionId: string;
  className?: string;
};

export function SessionConsole({ sessionId, className }: SessionConsoleProps) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMsg: ConsoleMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    // scroll after state update
    setTimeout(scrollToBottom, 50);

    try {
      const result = await sendSessionMessage(sessionId, trimmed);

      const responseMsg: ConsoleMessage = {
        role: result.ok ? 'assistant' : 'error',
        content: result.response ?? result.error ?? 'No response',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, responseMsg]);
    } catch (err: unknown) {
      const errorMsg: ConsoleMessage = {
        role: 'error',
        content: err instanceof Error ? err.message : 'Failed to send message',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [input, isSending, sessionId, scrollToBottom]);

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-card-border bg-[#1e1e1e] overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-card-border px-4 py-2.5">
        <div className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-status-red/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-status-amber/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-status-green/60" />
        </div>
        <span className="ml-2 text-xs font-mono text-muted">
          session:{sessionId.slice(0, 8)}
        </span>
      </div>

      {/* Message area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]"
      >
        {messages.length === 0 && (
          <p className="text-xs text-muted/50 text-center py-8">
            Send a message to this session...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={`${msg.timestamp}-${i}`}
            className={cn(
              'text-sm font-mono leading-relaxed',
              msg.role === 'user' && 'text-accent',
              msg.role === 'assistant' && 'text-[#e8e0d8]',
              msg.role === 'error' && 'text-status-red',
            )}
          >
            <span className="text-muted/50 text-xs mr-2">
              {msg.role === 'user' ? '>' : msg.role === 'error' ? '!' : '<'}
            </span>
            {msg.content}
          </div>
        ))}
        {isSending && (
          <div className="text-xs text-muted animate-pulse">Waiting for response...</div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-card-border p-3">
        <div className="flex gap-2">
          <span className="text-accent font-mono text-sm mt-1.5">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 bg-transparent text-sm font-mono text-[#e8e0d8] placeholder:text-muted/40 outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="rounded-lg bg-accent/15 px-3 py-1 text-xs text-accent hover:bg-accent/25 transition-colors disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
