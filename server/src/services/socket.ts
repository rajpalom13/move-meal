import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

interface SocketUser {
  id: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

let io: Server | null = null;

export const initializeSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; role: string };
      socket.user = { id: decoded.userId, role: decoded.role };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.id}`);

    // Join user to their personal room
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }

    // Join cluster room
    socket.on('join:cluster', (clusterId: string) => {
      socket.join(`cluster:${clusterId}`);
      console.log(`User ${socket.user?.id} joined cluster ${clusterId}`);
    });

    // Leave cluster room
    socket.on('leave:cluster', (clusterId: string) => {
      socket.leave(`cluster:${clusterId}`);
      console.log(`User ${socket.user?.id} left cluster ${clusterId}`);
    });

    // Join vendor room
    socket.on('join:vendor', (vendorId: string) => {
      if (socket.user?.role === 'vendor') {
        socket.join(`vendor:${vendorId}`);
      }
    });

    // Join rider room
    socket.on('join:rider', (riderId: string) => {
      if (socket.user?.role === 'rider') {
        socket.join(`rider:${riderId}`);
      }
    });

    // Location update from rider
    socket.on('location:update', (data: { latitude: number; longitude: number }) => {
      if (socket.user?.role === 'rider') {
        io?.emit(`rider:location:${socket.user.id}`, {
          riderId: socket.user.id,
          ...data,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit events
export const emitToUser = (userId: string, event: string, data: unknown): void => {
  io?.to(`user:${userId}`).emit(event, data);
};

export const emitToCluster = (clusterId: string, event: string, data: unknown): void => {
  io?.to(`cluster:${clusterId}`).emit(event, data);
};

export const emitToVendor = (vendorId: string, event: string, data: unknown): void => {
  io?.to(`vendor:${vendorId}`).emit(event, data);
};

export const emitToRider = (riderId: string, event: string, data: unknown): void => {
  io?.to(`rider:${riderId}`).emit(event, data);
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
