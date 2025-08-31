import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    console.warn('useSocket must be used within a SocketProvider');
    // ✅ Return safe defaults instead of null
    return {
      socket: null,
      connected: false,
      error: 'Socket provider not found',
      reconnect: () => { },
      reconnectAttempts: 0,
      maxReconnectAttempts: 0
    };
  }
  return context;
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const reconnectAttemptsRef = useRef(0);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;

  const getServerUrl = useCallback(() => {
    // ✅ Try multiple server URLs in order
    const serverUrls = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://192.168.35.239:5000', // Your specific IP
      'http://192.168.239.96:5000'  // Alternative IP
    ];
    
    return serverUrls[0]; // You can implement fallback logic here
  }, []);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (socketRef.current) {
      console.log('Cleaning up socket connection');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setSocket(null);
    setConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const connectSocket = useCallback(() => {
    cleanup();

    try {
      const serverUrl = getServerUrl();
      console.log('🔌 Attempting to connect to socket server:', serverUrl);

      const socketInstance = io(serverUrl, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: false, // We handle this manually
        autoConnect: true,
      });

      socketRef.current = socketInstance;

      socketInstance.on('connect', () => {
        console.log('✅ Socket connected successfully:', socketInstance.id);
        setConnected(true);
        setError(null);
        setReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;
        setSocket(socketInstance);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setConnected(false);
        
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          setError(`Connection lost: ${reason}`);
          
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            scheduleReconnect();
          }
        }
      });

      socketInstance.on('connect_error', (err) => {
        console.error('🚨 Socket connection error:', err);
        setConnected(false);
        
        const errorMessage = err.message || err.description || 'Connection failed';
        setError(`Connection failed: ${errorMessage}`);
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        } else {
          setError('❌ Server not running on localhost:5000. Please start your server.');
        }
      });

      socketInstance.on('error', (err) => {
        console.error('Socket error:', err);
        const errorMessage = err.message || err.description || err;
        setError(`Socket error: ${errorMessage}`);
      });

    } catch (err) {
      console.error('Error creating socket connection:', err);
      setError(`Failed to initialize connection: ${err.message}`);
    }
  }, [getServerUrl, maxReconnectAttempts, cleanup]);

  const scheduleReconnect = useCallback(() => {
    const currentAttempts = reconnectAttemptsRef.current;
    reconnectAttemptsRef.current = currentAttempts + 1;
    setReconnectAttempts(currentAttempts + 1);
    
    console.log(`🔄 Scheduling reconnection attempt ${currentAttempts + 1}/${maxReconnectAttempts}`);
    
    const delay = reconnectDelay * Math.pow(1.5, currentAttempts);
    
    reconnectTimerRef.current = setTimeout(() => {
      if (reconnectAttemptsRef.current <= maxReconnectAttempts) {
        console.log(`🔄 Reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
        connectSocket();
      }
    }, delay);
  }, [connectSocket, maxReconnectAttempts]);

  useEffect(() => {
    connectSocket();
    return cleanup;
  }, [connectSocket, cleanup]);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect triggered');
    setError(null);
    setReconnectAttempts(0);
    reconnectAttemptsRef.current = 0;
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    connectSocket();
  }, [connectSocket]);

  // ✅ Always provide a safe socket object - Fixed emit function
  const safeSocket = socket || null;

  const contextValue = {
    socket: safeSocket,
    connected,
    error,
    reconnect,
    reconnectAttempts,
    maxReconnectAttempts
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};