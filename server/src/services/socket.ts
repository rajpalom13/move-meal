import { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

interface SocketUser {
  id: string;
  role: string;
}

interface AuthenticatedWebSocket extends WebSocket {
  user?: SocketUser;
  isAlive?: boolean;
  rooms: Set<string>;
}

interface WebSocketMessage {
  event: string;
  data?: unknown;
}

let wss: WebSocketServer | null = null;
const clients = new Map<string, Set<AuthenticatedWebSocket>>();

const getTokenFromRequest = (request: IncomingMessage): string | null => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  return url.searchParams.get('token');
};

const authenticateConnection = (request: IncomingMessage): SocketUser | null => {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; role: string };
    return { id: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
};

const addToRoom = (ws: AuthenticatedWebSocket, room: string): void => {
  ws.rooms.add(room);
  if (!clients.has(room)) {
    clients.set(room, new Set());
  }
  clients.get(room)!.add(ws);
};

const removeFromRoom = (ws: AuthenticatedWebSocket, room: string): void => {
  ws.rooms.delete(room);
  const roomClients = clients.get(room);
  if (roomClients) {
    roomClients.delete(ws);
    if (roomClients.size === 0) {
      clients.delete(room);
    }
  }
};

const removeFromAllRooms = (ws: AuthenticatedWebSocket): void => {
  ws.rooms.forEach((room) => {
    removeFromRoom(ws, room);
  });
};

const sendMessage = (ws: AuthenticatedWebSocket, event: string, data: unknown): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, data }));
  }
};

const broadcastToRoom = (room: string, event: string, data: unknown): void => {
  const roomClients = clients.get(room);
  if (roomClients) {
    const message = JSON.stringify({ event, data });
    roomClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

export const initializeSocket = (server: HttpServer): WebSocketServer => {
  wss = new WebSocketServer({ server });

  // Heartbeat to detect broken connections
  const interval = setInterval(() => {
    wss?.clients.forEach((ws) => {
      const client = ws as AuthenticatedWebSocket;
      if (client.isAlive === false) {
        removeFromAllRooms(client);
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
    const user = authenticateConnection(request);

    if (!user) {
      ws.close(4001, 'Authentication required');
      return;
    }

    ws.user = user;
    ws.isAlive = true;
    ws.rooms = new Set();

    console.log(`User connected: ${user.id}`);

    // Join user to their personal room
    addToRoom(ws, `user:${user.id}`);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (rawMessage: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(rawMessage.toString());
        const { event, data } = message;

        switch (event) {
          case 'join:cluster': {
            const clusterId = data as string;
            addToRoom(ws, `cluster:${clusterId}`);
            console.log(`User ${ws.user?.id} joined cluster ${clusterId}`);
            break;
          }

          case 'leave:cluster': {
            const clusterId = data as string;
            removeFromRoom(ws, `cluster:${clusterId}`);
            console.log(`User ${ws.user?.id} left cluster ${clusterId}`);
            break;
          }

          case 'join:vendor': {
            const vendorId = data as string;
            if (ws.user?.role === 'vendor') {
              addToRoom(ws, `vendor:${vendorId}`);
            }
            break;
          }

          case 'join:rider': {
            const riderId = data as string;
            if (ws.user?.role === 'rider') {
              addToRoom(ws, `rider:${riderId}`);
            }
            break;
          }

          case 'location:update': {
            if (ws.user?.role === 'rider') {
              const locationData = data as { latitude: number; longitude: number };
              // Broadcast to all connected clients
              broadcastToAll(`rider:location:${ws.user.id}`, {
                riderId: ws.user.id,
                ...locationData,
              });
            }
            break;
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log(`User disconnected: ${ws.user?.id}`);
      removeFromAllRooms(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      removeFromAllRooms(ws);
    });
  });

  return wss;
};

export const getWSS = (): WebSocketServer => {
  if (!wss) {
    throw new Error('WebSocket server not initialized');
  }
  return wss;
};

// Broadcast to all connected clients
const broadcastToAll = (event: string, data: unknown): void => {
  if (!wss) return;
  const message = JSON.stringify({ event, data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Emit events
export const emitToUser = (userId: string, event: string, data: unknown): void => {
  broadcastToRoom(`user:${userId}`, event, data);
};

export const emitToCluster = (clusterId: string, event: string, data: unknown): void => {
  broadcastToRoom(`cluster:${clusterId}`, event, data);
};

export const emitToVendor = (vendorId: string, event: string, data: unknown): void => {
  broadcastToRoom(`vendor:${vendorId}`, event, data);
};

export const emitToRider = (riderId: string, event: string, data: unknown): void => {
  broadcastToRoom(`rider:${riderId}`, event, data);
};

// Cluster events
export const notifyClusterUpdate = (clusterId: string, data: unknown): void => {
  emitToCluster(clusterId, 'cluster:updated', data);
};

export const notifyMemberJoined = (clusterId: string, member: unknown): void => {
  emitToCluster(clusterId, 'cluster:member:joined', member);
};

export const notifyMemberLeft = (clusterId: string, memberId: string): void => {
  emitToCluster(clusterId, 'cluster:member:left', { memberId });
};

export const notifyOrderStatusChange = (userId: string, orderId: string, status: string): void => {
  emitToUser(userId, 'order:status', { orderId, status });
};

export const notifyDeliveryStarted = (clusterId: string, riderId: string): void => {
  emitToCluster(clusterId, 'delivery:started', { riderId });
};
