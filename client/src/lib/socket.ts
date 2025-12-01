const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:5000';

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
let currentToken: string | null = null;

type EventCallback = (data: unknown) => void;
const eventListeners = new Map<string, Set<EventCallback>>();

const getWebSocketUrl = (token: string): string => {
  const baseUrl = SOCKET_URL.replace(/^http/, 'ws');
  return `${baseUrl}?token=${encodeURIComponent(token)}`;
};

const handleMessage = (event: MessageEvent): void => {
  try {
    const message = JSON.parse(event.data);
    const { event: eventName, data } = message;

    const listeners = eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
  }
};

const attemptReconnect = (): void => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached');
    return;
  }

  if (!currentToken) {
    console.error('No token available for reconnection');
    return;
  }

  reconnectAttempts++;
  console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

  setTimeout(() => {
    if (currentToken) {
      initSocket(currentToken);
    }
  }, RECONNECT_DELAY);
};

export const initSocket = (token: string): WebSocket => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }

  currentToken = token;
  reconnectAttempts = 0;

  socket = new WebSocket(getWebSocketUrl(token));

  socket.onopen = () => {
    console.log('Socket connected');
    reconnectAttempts = 0;
  };

  socket.onclose = (event) => {
    console.log('Socket disconnected', event.code, event.reason);
    if (event.code !== 1000 && event.code !== 4001) {
      attemptReconnect();
    }
  };

  socket.onerror = (error) => {
    console.error('Socket connection error:', error);
  };

  socket.onmessage = handleMessage;

  return socket;
};

export const getSocket = (): WebSocket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    currentToken = null;
    socket.close(1000, 'Client disconnect');
    socket = null;
  }
  eventListeners.clear();
};

const emit = (event: string, data?: unknown): void => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event, data }));
  }
};

const on = (event: string, callback: EventCallback): void => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback);
};

const off = (event: string, callback?: EventCallback): void => {
  if (callback) {
    eventListeners.get(event)?.delete(callback);
  } else {
    eventListeners.delete(event);
  }
};

// Cluster events
export const joinClusterRoom = (clusterId: string): void => {
  emit('join:cluster', clusterId);
};

export const leaveClusterRoom = (clusterId: string): void => {
  emit('leave:cluster', clusterId);
};

// Vendor events
export const joinVendorRoom = (vendorId: string): void => {
  emit('join:vendor', vendorId);
};

// Rider events
export const joinRiderRoom = (riderId: string): void => {
  emit('join:rider', riderId);
};

export const updateRiderLocation = (latitude: number, longitude: number): void => {
  emit('location:update', { latitude, longitude });
};

// Event listeners
export const onClusterUpdated = (callback: (data: unknown) => void): void => {
  on('cluster:updated', callback);
};

export const onMemberJoined = (callback: (data: unknown) => void): void => {
  on('cluster:member:joined', callback);
};

export const onMemberLeft = (callback: (data: unknown) => void): void => {
  on('cluster:member:left', callback);
};

export const onOrderStatus = (callback: (data: { orderId: string; status: string }) => void): void => {
  on('order:status', callback as EventCallback);
};

export const onNewOrder = (callback: (data: unknown) => void): void => {
  on('order:new', callback);
};

export const onDeliveryStarted = (callback: (data: { riderId: string }) => void): void => {
  on('delivery:started', callback as EventCallback);
};

export const onDeliveryAssigned = (callback: (data: unknown) => void): void => {
  on('delivery:assigned', callback);
};

export const onRiderLocation = (riderId: string, callback: (data: { latitude: number; longitude: number }) => void): void => {
  on(`rider:location:${riderId}`, callback as EventCallback);
};

// Remove listeners
export const offClusterUpdated = (): void => {
  off('cluster:updated');
};

export const offMemberJoined = (): void => {
  off('cluster:member:joined');
};

export const offMemberLeft = (): void => {
  off('cluster:member:left');
};

export const offOrderStatus = (): void => {
  off('order:status');
};
