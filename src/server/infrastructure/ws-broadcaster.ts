import { WebSocketServer, WebSocket } from 'ws';

type Channel = 'events' | 'sessions' | 'analysis';

interface BroadcastMessage {
  channel: Channel;
  data: unknown;
  timestamp: string;
}

let wssInstance: WebSocketServer | null = null;
const channelSubscribers = new Map<Channel, Set<WebSocket>>();

function ensureChannelSet(channel: Channel): Set<WebSocket> {
  let subs = channelSubscribers.get(channel);
  if (!subs) {
    subs = new Set<WebSocket>();
    channelSubscribers.set(channel, subs);
  }
  return subs;
}

export function initWebSocketServer(port: number): WebSocketServer {
  if (wssInstance) {
    return wssInstance;
  }

  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    // Subscribe to all channels by default
    for (const channel of ['events', 'sessions', 'analysis'] as Channel[]) {
      ensureChannelSet(channel).add(ws);
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        if (msg.type === 'subscribe' && typeof msg.channel === 'string') {
          const ch = msg.channel as Channel;
          ensureChannelSet(ch).add(ws);
        }
        if (msg.type === 'unsubscribe' && typeof msg.channel === 'string') {
          const ch = msg.channel as Channel;
          channelSubscribers.get(ch)?.delete(ws);
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      for (const subs of channelSubscribers.values()) {
        subs.delete(ws);
      }
    });
  });

  wssInstance = wss;
  return wss;
}

export function broadcast(channel: Channel, data: unknown): void {
  const subs = channelSubscribers.get(channel);
  if (!subs) return;

  const message: BroadcastMessage = {
    channel,
    data,
    timestamp: new Date().toISOString(),
  };

  const payload = JSON.stringify(message);

  for (const ws of subs) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

export function getConnectedCount(): number {
  if (!wssInstance) return 0;
  let count = 0;
  for (const client of wssInstance.clients) {
    if (client.readyState === WebSocket.OPEN) {
      count++;
    }
  }
  return count;
}

export function closeWebSocketServer(): void {
  if (wssInstance) {
    wssInstance.close();
    wssInstance = null;
    channelSubscribers.clear();
  }
}
