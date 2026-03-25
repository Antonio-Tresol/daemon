'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
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

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
    }
  }, [input, isSending, sessionId, scrollToBottom]);

  return (
    <div
      className={clsx(
        'flex flex-col rounded-lg border border-border bg-depth-1 overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-signal-red/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-signal-amber/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-signal-green/60" />
        </div>
        <span className="ml-2 text-xs font-mono text-text-muted">
          session:{sessionId.slice(0, 8)}
        </span>
      </div>

      {/* Message area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]"
      >
        {messages.length === 0 && (
          <p className="text-xs text-text-muted/50 text-center py-8">
            Send a message to this session...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={`${msg.timestamp}-${i}`}
            className={clsx(
              'text-sm font-mono leading-relaxed',
              msg.role === 'user' && 'text-signal-green',
              msg.role === 'assistant' && 'text-text-primary',
              msg.role === 'error' && 'text-signal-red',
            )}
          >
            <span className="text-text-muted/50 text-xs mr-2">
              {msg.role === 'user' ? '>' : msg.role === 'error' ? '!' : '<'}
            </span>
            {msg.content}
          </div>
        ))}
        {isSending && (
          <div className="text-xs text-text-muted animate-pulse">Waiting for response...</div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <span className="text-signal-green font-mono text-sm mt-1.5">{'>'}</span>
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
            className="flex-1 bg-transparent text-sm font-mono text-text-primary placeholder:text-text-muted/40 outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="rounded-md bg-signal-green/15 px-3 py-1 text-xs text-signal-green hover:bg-signal-green/25 transition-colors disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
