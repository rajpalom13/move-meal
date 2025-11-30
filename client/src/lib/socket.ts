import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Cluster events
export const joinClusterRoom = (clusterId: string): void => {
  socket?.emit('join:cluster', clusterId);
};

export const leaveClusterRoom = (clusterId: string): void => {
  socket?.emit('leave:cluster', clusterId);
};

// Vendor events
export const joinVendorRoom = (vendorId: string): void => {
  socket?.emit('join:vendor', vendorId);
};

// Rider events
export const joinRiderRoom = (riderId: string): void => {
  socket?.emit('join:rider', riderId);
};

export const updateRiderLocation = (latitude: number, longitude: number): void => {
  socket?.emit('location:update', { latitude, longitude });
};

// Event listeners
export const onClusterUpdated = (callback: (data: unknown) => void): void => {
  socket?.on('cluster:updated', callback);
};

export const onMemberJoined = (callback: (data: unknown) => void): void => {
  socket?.on('cluster:member:joined', callback);
};

export const onMemberLeft = (callback: (data: unknown) => void): void => {
  socket?.on('cluster:member:left', callback);
};

export const onOrderStatus = (callback: (data: { orderId: string; status: string }) => void): void => {
  socket?.on('order:status', callback);
};

export const onNewOrder = (callback: (data: unknown) => void): void => {
  socket?.on('order:new', callback);
};

export const onDeliveryStarted = (callback: (data: { riderId: string }) => void): void => {
  socket?.on('delivery:started', callback);
};

export const onDeliveryAssigned = (callback: (data: unknown) => void): void => {
  socket?.on('delivery:assigned', callback);
};

export const onRiderLocation = (riderId: string, callback: (data: { latitude: number; longitude: number }) => void): void => {
  socket?.on(`rider:location:${riderId}`, callback);
};

// Remove listeners
export const offClusterUpdated = (): void => {
  socket?.off('cluster:updated');
};

export const offMemberJoined = (): void => {
  socket?.off('cluster:member:joined');
};

export const offMemberLeft = (): void => {
  socket?.off('cluster:member:left');
};

export const offOrderStatus = (): void => {
  socket?.off('order:status');
};
