import { io } from "socket.io-client";

// Get server URL from environment or use fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://project-h-zv5o.onrender.com';

// Connection status constants
export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

// Socket configuration hardened for restrictive networks (e.g., campus/enterprise)
const socketConfig = {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  maxReconnectionAttempts: 5,
  timeout: 20000,
  forceNew: false,
  // Force HTTP long-polling to avoid websocket blocks on restrictive networks
  transports: ['polling'],
  upgrade: false,
  rememberUpgrade: false,
  // Keepalive settings
  pingTimeout: 60000,
  pingInterval: 25000,
  // Additional options for stability
  randomizationFactor: 0.5,
  secure: window.location.protocol === 'https:',
  // Avoid third-party cookie issues on locked-down networks
  withCredentials: false,
  // Custom headers for authentication
  extraHeaders: {},
  // Query parameters for initial connection
  query: {}
};

// Create socket instance
let socketInstance = null;
let connectionStatus = CONNECTION_STATUS.DISCONNECTED;
let reconnectAttempts = 0;
let connectionListeners = new Set();
let eventListeners = new Map();
let heartbeatInterval = null;
let lastPongTime = Date.now();

// Initialize socket connection
const initializeSocket = (authToken = null, userId = null) => {
  // If socket already exists and is connected, return it
  if (socketInstance && socketInstance.connected) {
    console.log('🔄 Socket already connected, reusing existing connection');
    return socketInstance;
  }

  // If socket exists but disconnected, clean it up first
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
  }

  console.log('🚀 Initializing socket connection...', { server: SERVER_URL, transports: socketConfig.transports });
  
  // Update config with auth info if provided
  const config = { ...socketConfig };
  
  if (authToken) {
    config.extraHeaders = {
      'Authorization': `Bearer ${authToken}`
    };
  }
  
  if (userId) {
    config.query = {
      userId: userId,
      timestamp: Date.now()
    };
  }

  // Create new socket instance
  socketInstance = io(SERVER_URL, config);
  
  setupEventListeners();
  setupHeartbeat();
  
  return socketInstance;
};

// Setup core event listeners
const setupEventListeners = () => {
  if (!socketInstance) return;

  // Connection events
  socketInstance.on('connect', handleConnect);
  socketInstance.on('connect_error', handleConnectError);
  socketInstance.on('disconnect', handleDisconnect);
  socketInstance.on('reconnect', handleReconnect);
  socketInstance.on('reconnect_attempt', handleReconnectAttempt);
  socketInstance.on('reconnect_error', handleReconnectError);
  socketInstance.on('reconnect_failed', handleReconnectFailed);
  
  // Custom events
  socketInstance.on('pong', handlePong);
  socketInstance.on('server_error', handleServerError);
  socketInstance.on('rate_limit', handleRateLimit);
  
  // User management events
  socketInstance.on('user_joined', handleUserJoined);
  socketInstance.on('user_left', handleUserLeft);
  socketInstance.on('users_online', handleUsersOnline);
  
  console.log('✅ Socket event listeners configured');
};

// Enhanced connection handler
const handleConnect = () => {
  console.log('🟢 Socket connected successfully');
  connectionStatus = CONNECTION_STATUS.CONNECTED;
  reconnectAttempts = 0;
  lastPongTime = Date.now();
  
  // Emit connection acknowledgment
  socketInstance.emit('connection_ack', {
    timestamp: Date.now(),
    clientInfo: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });
  
  notifyConnectionListeners('connected');
};

// Enhanced connection error handler
const handleConnectError = (error) => {
  console.error('🔴 Socket connection error:', error);
  connectionStatus = CONNECTION_STATUS.ERROR;
  
  // Parse error details
  const errorDetails = {
    message: error.message || 'Connection failed',
    type: error.type || 'unknown',
    description: error.description || 'Unknown connection error',
    timestamp: Date.now()
  };
  
  notifyConnectionListeners('error', errorDetails);
};

// Enhanced disconnect handler
const handleDisconnect = (reason, details) => {
  console.log('🔴 Socket disconnected:', reason, details);
  connectionStatus = CONNECTION_STATUS.DISCONNECTED;
  
  const disconnectInfo = {
    reason,
    details,
    timestamp: Date.now(),
    wasClean: reason === 'io client disconnect'
  };
  
  // Clear heartbeat when disconnected
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  notifyConnectionListeners('disconnected', disconnectInfo);
};

// Reconnection handlers
const handleReconnect = (attemptNumber) => {
  console.log(`🟡 Socket reconnected after ${attemptNumber} attempts`);
  connectionStatus = CONNECTION_STATUS.CONNECTED;
  reconnectAttempts = 0;
  setupHeartbeat();
  notifyConnectionListeners('reconnected');
};

const handleReconnectAttempt = (attemptNumber) => {
  console.log(`🔄 Reconnection attempt ${attemptNumber}`);
  connectionStatus = CONNECTION_STATUS.RECONNECTING;
  reconnectAttempts = attemptNumber;
  notifyConnectionListeners('reconnecting', { attempt: attemptNumber });
};

const handleReconnectError = (error) => {
  console.error('🔴 Reconnection error:', error);
  notifyConnectionListeners('reconnect_error', error);
};

const handleReconnectFailed = () => {
  console.error('🔴 All reconnection attempts failed');
  connectionStatus = CONNECTION_STATUS.ERROR;
  notifyConnectionListeners('reconnect_failed');
};

// Heartbeat mechanism for connection health
const setupHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  heartbeatInterval = setInterval(() => {
    if (socketInstance && socketInstance.connected) {
      const now = Date.now();
      
      // Check if we haven't received a pong recently
      if (now - lastPongTime > 90000) { // 90 seconds
        console.warn('⚠️ Heartbeat timeout detected, forcing reconnection');
        socketInstance.disconnect();
        return;
      }
      
      // Send ping
      socketInstance.emit('ping', { timestamp: now });
    }
  }, 30000); // Send ping every 30 seconds
};

const handlePong = (data) => {
  lastPongTime = Date.now();
  const latency = lastPongTime - (data?.timestamp || 0);
  console.log(`💓 Heartbeat: ${latency}ms latency`);
};

// Server error handlers
const handleServerError = (error) => {
  console.error('🚨 Server error:', error);
  notifyConnectionListeners('server_error', error);
};

const handleRateLimit = (data) => {
  console.warn('⚠️ Rate limit exceeded:', data);
  notifyConnectionListeners('rate_limit', data);
};

// User management handlers
const handleUserJoined = (data) => {
  console.log('👋 User joined:', data);
  notifyEventListeners('user_joined', data);
};

const handleUserLeft = (data) => {
  console.log('👋 User left:', data);
  notifyEventListeners('user_left', data);
};

const handleUsersOnline = (data) => {
  console.log('👥 Users online:', data);
  notifyEventListeners('users_online', data);
};

// Connection listener management
const addConnectionListener = (listener) => {
  if (typeof listener === 'function') {
    connectionListeners.add(listener);
    return () => connectionListeners.delete(listener);
  }
};

const removeConnectionListener = (listener) => {
  connectionListeners.delete(listener);
};

const notifyConnectionListeners = (status, data = null) => {
  connectionListeners.forEach(listener => {
    try {
      listener(status, data);
    } catch (error) {
      console.error('❌ Error in connection listener:', error);
    }
  });
};

// Event listener management
const addEventListener = (event, listener) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event).add(listener);
  
  return () => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        eventListeners.delete(event);
      }
    }
  };
};

const removeEventListener = (event, listener) => {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.delete(listener);
    if (listeners.size === 0) {
      eventListeners.delete(event);
    }
  }
};

const notifyEventListeners = (event, data) => {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`❌ Error in ${event} listener:`, error);
      }
    });
  }
};

// Enhanced emit with retry logic
const emitWithRetry = (event, data, maxRetries = 3, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    if (!socketInstance || !socketInstance.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    let retryCount = 0;
    const attemptEmit = () => {
      const timeoutId = setTimeout(() => {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retrying emit for ${event} (attempt ${retryCount}/${maxRetries})`);
          attemptEmit();
        } else {
          reject(new Error(`Emit timeout for ${event} after ${maxRetries} retries`));
        }
      }, timeout);

      socketInstance.emit(event, data, (response) => {
        clearTimeout(timeoutId);
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    };

    attemptEmit();
  });
};

// Room management utilities
const joinRoom = (roomId, userId, userData = {}) => {
  if (!socket || !socket.connected) {
    console.warn('⚠️ Cannot join room: socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  console.log(`🏠 Joining room: ${roomId}`);
  return emitWithRetry('joinRoom', {
    roomId,
    userId,
    userData,
    timestamp: Date.now()
  });
};

const leaveRoom = (roomId, userId) => {
  if (!socket) {
    console.warn('⚠️ Cannot leave room: socket not available');
    return Promise.resolve();
  }

  console.log(`🚪 Leaving room: ${roomId}`);
  return emitWithRetry('leaveRoom', {
    roomId,
    userId,
    timestamp: Date.now()
  });
};

// Message utilities
const sendMessage = (messageData) => {
  if (!socket || !socket.connected) {
    console.warn('⚠️ Cannot send message: socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  const enrichedMessage = {
    ...messageData,
    timestamp: Date.now(),
    id: messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  console.log('📤 Sending message:', enrichedMessage);
  return emitWithRetry('sendMessage', enrichedMessage, 2, 3000);
};

// Typing indicator utilities
const sendTypingStatus = (chatId, userId, isTyping, userName = null) => {
  if (!socket || !socket.connected) return;

  socket.emit('typing', {
    chatId,
    userId,
    userName,
    isTyping,
    timestamp: Date.now()
  });
};

// User presence utilities
const updatePresence = (userId, isOnline, lastSeen = null) => {
  if (!socket || !socket.connected) return;

  socket.emit('updatePresence', {
    userId,
    isOnline,
    lastSeen: lastSeen || Date.now(),
    timestamp: Date.now()
  });
};

// Connection utilities
const getConnectionStatus = () => connectionStatus;
const getReconnectAttempts = () => reconnectAttempts;
const isConnected = () => socket && socket.connected;
const getLatency = () => socket ? socket.ping : null;

// Socket instance getter
const getSocket = () => socket;

// Cleanup function
const cleanup = () => {
  console.log('🧹 Cleaning up socket connection...');
  
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  connectionListeners.clear();
  eventListeners.clear();
  
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  
  connectionStatus = CONNECTION_STATUS.DISCONNECTED;
  reconnectAttempts = 0;
};

// Force reconnection
const forceReconnect = () => {
  if (socket) {
    console.log('🔄 Forcing socket reconnection...');
    socket.disconnect();
    socket.connect();
  }
};

// Initialize socket immediately for backward compatibility


// Export socket instance as named export for backward compatibility
export const socket = socketInstance;

// Export enhanced socket utilities
export {
  initializeSocket,
  getSocket,
  addConnectionListener,
  removeConnectionListener,
  addEventListener,
  removeEventListener,
  emitWithRetry,
  joinRoom,
  leaveRoom,
  sendMessage,
  sendTypingStatus,
  updatePresence,
  getConnectionStatus,
  getReconnectAttempts,
  isConnected,
  getLatency,
  cleanup,
  forceReconnect,
  getConnectionStatus as getStatus,
  getReconnectAttempts as getAttempts,
};

// Export socket instance for backward compatibility
export default socketInstance;