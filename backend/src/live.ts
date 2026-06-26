import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

// Live push channel. The app connects to ws://host:4000/live?deviceId=<id>
// and receives JSON messages whenever that device's state changes.
const subscribers = new Map<string, Set<WebSocket>>();

export function attachLiveHub(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', (socket, request) => {
    const url = new URL(request.url ?? '/live', 'http://localhost');
    const deviceId = url.searchParams.get('deviceId');
    if (!deviceId) {
      socket.close(4000, 'deviceId query param required');
      return;
    }

    let pool = subscribers.get(deviceId);
    if (!pool) {
      pool = new Set();
      subscribers.set(deviceId, pool);
    }
    pool.add(socket);

    socket.on('close', () => {
      pool?.delete(socket);
    });
  });
}

export function broadcast(deviceId: string, message: { type: string; [key: string]: unknown }): void {
  const pool = subscribers.get(deviceId);
  if (!pool) return;
  const payload = JSON.stringify(message);
  for (const socket of pool) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}
