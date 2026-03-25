'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Channel = 'events' | 'sessions' | 'analysis';

type WebSocketMessage = {
  channel: Channel;
  data: unknown;
};

type UseWebSocketReturn = {
  lastMessage: WebSocketMessage | null;
  isConnected: boolean;
  subscribe: (channel: Channel) => void;
};

function getWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:3000/api/ws';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/ws`;
}

const WS_URL = getWsUrl();
const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 1000;

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribedChannelsRef = useRef<Set<Channel>>(new Set());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptRef.current = 0;

        for (const channel of subscribedChannelsRef.current) {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string) as WebSocketMessage; // WS event.data is MessageEvent['data'], JSON.parse returns unknown
          setLastMessage(parsed);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        const delay = Math.min(
          BASE_RECONNECT_DELAY * 2 ** reconnectAttemptRef.current,
          MAX_RECONNECT_DELAY,
        );
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // connection failed, will retry via onclose
    }
  }, []);

  const subscribe = useCallback((channel: Channel) => {
    subscribedChannelsRef.current.add(channel);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return { lastMessage, isConnected, subscribe };
}
